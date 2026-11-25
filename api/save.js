// GET  /api/save  → load this user's cloud save
// POST /api/save  → validate + store save, refresh leaderboard row
import { getSession } from './_lib/session.js';
import { db, ensureSchema, json } from './_lib/db.js';
import { validateSave, MAX_SAVE_BYTES } from './_lib/validate.js';

const MIN_PUSH_INTERVAL_MS = 10_000; // throttle writes per user

export async function GET(request) {
  const session = getSession(request);
  if (!session) return json({ error: 'not_signed_in' }, 401);

  try {
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      SELECT data, client_updated_at, updated_at
      FROM saves WHERE user_id = ${session.userId} LIMIT 1`;

    if (!rows.length) return json({ save: null });

    const row = rows[0];
    const v = validateSave(row.data);
    return json({
      save: row.data,
      clientUpdatedAt: Number(row.client_updated_at) || 0,
      updatedAt: row.updated_at,
      summary: v.ok ? v.derived : null,
    });
  } catch (err) {
    console.error('[save:GET]', err);
    return json({ error: 'db_error' }, 500);
  }
}

export async function POST(request) {
  const session = getSession(request);
  if (!session) return json({ error: 'not_signed_in' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const result = validateSave(body?.save);
  if (!result.ok) return json({ error: result.error }, 400);

  const { save, derived } = result;
  const clientUpdatedAt = Date.now();
  const expected = body?.revision ?? null;
  if (expected !== null && (!Number.isSafeInteger(expected) || expected < 0)) return json({ error: "invalid_revision" }, 400);

  try {
    await ensureSchema();
    const sql = db();

    // Throttle: reject writes that arrive too fast
    const existing = await sql`
      SELECT updated_at, client_updated_at FROM saves WHERE user_id = ${session.userId} LIMIT 1`;
    if (existing.length) {
      const age = Date.now() - new Date(existing[0].updated_at).getTime();
      if (age < MIN_PUSH_INTERVAL_MS && !body?.force) {
        return json({ ok: false, throttled: true, retryInMs: MIN_PUSH_INTERVAL_MS - age }, 429);
      }
    }

    const written = await sql`
      INSERT INTO saves (user_id, data, client_updated_at, updated_at)
      SELECT ${session.userId}, ${JSON.stringify(save)}::jsonb, ${clientUpdatedAt}, now()
      WHERE ${expected}::bigint IS NULL OR EXISTS (SELECT 1 FROM saves WHERE user_id = ${session.userId})
      ON CONFLICT (user_id) DO UPDATE
        SET data = EXCLUDED.data,
            client_updated_at = GREATEST(saves.client_updated_at + 1, EXCLUDED.client_updated_at),
            updated_at = now()
        WHERE saves.client_updated_at = ${expected}::bigint
        RETURNING client_updated_at`;
    if (!written.length) return json({ error: "save_conflict" }, 409);

    await sql`
      INSERT INTO leaderboard (
        user_id, display_name, avatar_url, total_level, combat_level, shards,
        ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker, title, updated_at)
      SELECT u.id, u.display_name, u.avatar_url,
             ${derived.totalLevel}, ${derived.combatLevel}, ${derived.shards},
             ${derived.ascensions}, ${derived.lifetimeGold}, ${derived.bossKills},
             ${derived.questsDone}, ${derived.cyclebreaker}, ${derived.title}, now()
      FROM users u WHERE u.id = ${session.userId}
      ON CONFLICT (user_id) DO UPDATE
        SET display_name  = EXCLUDED.display_name,
            avatar_url    = EXCLUDED.avatar_url,
            total_level   = EXCLUDED.total_level,
            combat_level  = EXCLUDED.combat_level,
            shards        = EXCLUDED.shards,
            ascensions    = EXCLUDED.ascensions,
            lifetime_gold = EXCLUDED.lifetime_gold,
            boss_kills    = EXCLUDED.boss_kills,
            quests_done   = EXCLUDED.quests_done,
            cyclebreaker  = EXCLUDED.cyclebreaker,
            title         = EXCLUDED.title,
            updated_at    = now()`;

    return json({ ok: true, revision: Number(written[0].client_updated_at), summary: derived, maxBytes: MAX_SAVE_BYTES });
  } catch (err) {
    console.error('[save:POST]', err);
    return json({ error: 'db_error' }, 500);
  }
}

export async function DELETE(request) {
  const session = getSession(request);
  if (!session) return json({ error: 'not_signed_in' }, 401);
  try {
    await ensureSchema();
    const sql = db();
    await sql`DELETE FROM saves WHERE user_id = ${session.userId}`;
    await sql`DELETE FROM leaderboard WHERE user_id = ${session.userId}`;
    return json({ ok: true });
  } catch (err) {
    console.error('[save:DELETE]', err);
    return json({ error: 'db_error' }, 500);
  }
}
