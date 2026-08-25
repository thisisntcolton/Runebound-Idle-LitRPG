// GET /api/me  → current signed-in user (or null) + which providers are configured
import { getSession } from './_lib/session.js';
import { configuredProviders } from './_lib/providers.js';
import { db, ensureSchema, json } from './_lib/db.js';

export async function GET(request) {
  const providers = configuredProviders();
  const session = getSession(request);

  if (!session) return json({ user: null, providers });

  try {
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      SELECT id, display_name, avatar_url, provider, created_at
      FROM users WHERE id = ${session.userId} LIMIT 1`;
    if (!rows.length) return json({ user: null, providers });

    const u = rows[0];
    return json({
      user: {
        id: u.id,
        name: u.display_name,
        avatar: u.avatar_url,
        provider: u.provider,
        since: u.created_at,
      },
      providers,
    });
  } catch (err) {
    console.error('[me]', err);
    return json({ user: null, providers, error: 'db_unavailable' }, 200);
  }
}
