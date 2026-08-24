// ============================================================
// Neon Postgres client + schema bootstrap
// DATABASE_URL is injected automatically by the Vercel↔Neon integration.
// ============================================================
import { neon } from '@neondatabase/serverless';

let _sql = null;
let _schemaReady = null;

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — connect Neon in the Vercel dashboard.');
  }
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Idempotent schema creation, run once per cold start.
export function ensureSchema() {
  if (_schemaReady) return _schemaReady;
  _schemaReady = (async () => {
    const sql = db();
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        provider      TEXT NOT NULL,
        provider_id   TEXT NOT NULL,
        display_name  TEXT NOT NULL,
        avatar_url    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS saves (
        user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data              JSONB NOT NULL,
        client_updated_at BIGINT NOT NULL DEFAULT 0,
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name  TEXT NOT NULL,
        avatar_url    TEXT,
        total_level   INT NOT NULL DEFAULT 0,
        combat_level  INT NOT NULL DEFAULT 0,
        shards        BIGINT NOT NULL DEFAULT 0,
        ascensions    INT NOT NULL DEFAULT 0,
        lifetime_gold BIGINT NOT NULL DEFAULT 0,
        boss_kills    INT NOT NULL DEFAULT 0,
        quests_done   INT NOT NULL DEFAULT 0,
        cyclebreaker  BOOLEAN NOT NULL DEFAULT false,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS lb_total_level_idx   ON leaderboard (total_level DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS lb_shards_idx        ON leaderboard (shards DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS lb_gold_idx          ON leaderboard (lifetime_gold DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS lb_boss_idx          ON leaderboard (boss_kills DESC)`;
  })().catch(err => { _schemaReady = null; throw err; });
  return _schemaReady;
}

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders },
  });
}
