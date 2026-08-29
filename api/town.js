// ============================================================
// /api/town — publishing a Hearthwick, and visiting somebody else's
//
//   PUT  /api/town           publish YOUR snapshot (signed in)
//   GET  /api/town?user=id   fetch somebody's, to visit it
//   GET  /api/town           your own gifts, waiting
//   POST /api/town?gift=id   leave a gift on somebody's doorstep
//
// A snapshot is deliberately NOT a save. It is a short, public description
// of a town — its name, its buildings, the house, who lives there, and
// which of your former selves are about. Everything a visitor needs and
// nothing they do not, kept in its own table so that no query can
// accidentally serve a private save to a stranger.
//
// Everything written here is validated and clamped. This is the one
// surface in the game where one player's data reaches another player's
// screen, so nothing arrives on trust: names are length-capped, lists are
// count-capped, and the note is stripped of anything that is not text.
// ============================================================
import { getSession } from './_lib/session.js';
import { db, ensureSchema, json } from './_lib/db.js';

const MAX_NOTE = 140;
const MAX_PLOTS = 12;
const MAX_PLACED = 40;
const MAX_LEGACY = 24;

const str = (v, n) => String(v ?? '').replace(/[\x00-\x1f<>]/g, '').slice(0, n);
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));

/**
 * Rebuild the snapshot from scratch rather than trusting the shape sent.
 *
 * A client is not a source of truth about anything, least of all about a
 * document that will be rendered inside somebody else's game.
 */
function cleanSnapshot(raw = {}) {
  const home = raw.home || {};
  const placed = {};
  let placedCount = 0;
  for (const [room, list] of Object.entries(home.placed || {})) {
    if (placedCount >= MAX_PLACED) break;
    const clean = (Array.isArray(list) ? list : [])
      .slice(0, 12)
      .map(id => str(id, 40))
      .filter(Boolean);
    placedCount += clean.length;
    placed[str(room, 24)] = clean;
  }

  return {
    townName: str(raw.townName, 28) || 'Hearthwick',
    townLevel: int(raw.townLevel, 0, 999),
    era: int(raw.era, 1, 2),
    ascensions: int(raw.ascensions, 0, 9999),
    plots: (Array.isArray(raw.plots) ? raw.plots : []).slice(0, MAX_PLOTS).map(p => ({
      building: str(p?.building, 32) || null,
      level: int(p?.level, 0, 20),
    })),
    home: {
      level: int(home.level, 1, 8),
      placed,
      sets: (Array.isArray(home.sets) ? home.sets : []).slice(0, 8).map(s => str(s, 24)),
    },
    residents: (Array.isArray(raw.residents) ? raw.residents : []).slice(0, 16).map(r => ({
      id: str(r?.id, 24), bond: int(r?.bond, 0, 100),
    })),
    legacy: (Array.isArray(raw.legacy) ? raw.legacy : []).slice(0, MAX_LEGACY).map(w => ({
      name: str(w?.name, 24),
      cycle: int(w?.cycle, 0, 9999),
      className: str(w?.className, 24) || null,
      classIcon: str(w?.classIcon, 8) || '🎭',
      title: str(w?.title, 32) || null,
      charLevel: int(w?.charLevel, 0, 99999),
    })),
    updatedAt: Date.now(),
  };
}

export async function GET(request) {
  const url = new URL(request.url);
  const who = url.searchParams.get('user');
  try {
    await ensureSchema();
    const sql = db();

    if (who) {
      const rows = await sql`
        SELECT user_id, display_name, snapshot, updated_at
        FROM towns WHERE user_id = ${who} LIMIT 1`;
      if (!rows.length) return json({ town: null });
      const r = rows[0];
      return json({ town: { userId: r.user_id, name: r.display_name,
                            snapshot: r.snapshot, updatedAt: r.updated_at } });
    }

    // No user named: your own waiting gifts.
    const session = getSession(request);
    if (!session) return json({ gifts: [] });
    const gifts = await sql`
      SELECT id, from_name, note, created_at FROM town_gifts
      WHERE to_user = ${session.userId} AND claimed = false
      ORDER BY created_at DESC LIMIT 25`;
    return json({ gifts });
  } catch (err) {
    return json({ error: 'town lookup failed', detail: String(err?.message || err) }, 500);
  }
}

export async function PUT(request) {
  const session = getSession(request);
  if (!session) return json({ error: 'not signed in' }, 401);
  try {
    const body = await request.json();
    const snapshot = cleanSnapshot(body?.snapshot || {});
    await ensureSchema();
    const sql = db();
    const users = await sql`SELECT display_name FROM users WHERE id = ${session.userId} LIMIT 1`;
    const name = users[0]?.display_name || 'Somebody';
    await sql`
      INSERT INTO towns (user_id, display_name, snapshot, updated_at)
      VALUES (${session.userId}, ${name}, ${JSON.stringify(snapshot)}, now())
      ON CONFLICT (user_id) DO UPDATE
        SET snapshot = EXCLUDED.snapshot,
            display_name = EXCLUDED.display_name,
            updated_at = now()`;
    return json({ ok: true, snapshot });
  } catch (err) {
    return json({ error: 'publish failed', detail: String(err?.message || err) }, 500);
  }
}

export async function POST(request) {
  const session = getSession(request);
  if (!session) return json({ error: 'not signed in' }, 401);
  const url = new URL(request.url);
  const to = url.searchParams.get('gift');
  if (!to) return json({ error: 'no recipient' }, 400);
  if (to === session.userId) return json({ error: 'you already live there' }, 400);
  try {
    const body = await request.json().catch(() => ({}));
    const note = str(body?.note, MAX_NOTE);
    await ensureSchema();
    const sql = db();

    // One gift per person per day. A doorstep is not a mailbox.
    const recent = await sql`
      SELECT 1 FROM town_gifts
      WHERE to_user = ${to} AND from_user = ${session.userId}
        AND created_at > now() - interval '20 hours' LIMIT 1`;
    if (recent.length) return json({ error: 'you left something there already today' }, 429);

    const users = await sql`SELECT display_name FROM users WHERE id = ${session.userId} LIMIT 1`;
    if (!users.length) return json({ error: 'unknown sender' }, 400);

    await sql`
      INSERT INTO town_gifts (to_user, from_user, from_name, note)
      VALUES (${to}, ${session.userId}, ${users[0].display_name}, ${note || null})`;
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'gift failed', detail: String(err?.message || err) }, 500);
  }
}

export async function DELETE(request) {
  // Claim everything waiting. The reward is granted client-side; this
  // only marks them taken, so a replay cannot mint gifts.
  const session = getSession(request);
  if (!session) return json({ error: 'not signed in' }, 401);
  try {
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      UPDATE town_gifts SET claimed = true
      WHERE to_user = ${session.userId} AND claimed = false
      RETURNING id, from_name, note`;
    return json({ claimed: rows });
  } catch (err) {
    return json({ error: 'claim failed', detail: String(err?.message || err) }, 500);
  }
}
