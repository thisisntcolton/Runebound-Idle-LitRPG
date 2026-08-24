// GET /api/leaderboard?board=total_level|shards|lifetime_gold|boss_kills|cyclebreakers
import { getSession } from './_lib/session.js';
import { db, ensureSchema, json } from './_lib/db.js';

const BOARDS = {
  total_level:   { label: 'Total Level',   order: 'total_level' },
  shards:        { label: 'Fate Shards',   order: 'shards' },
  lifetime_gold: { label: 'Lifetime Gold', order: 'lifetime_gold' },
  boss_kills:    { label: 'Boss Kills',    order: 'boss_kills' },
  cyclebreakers: { label: 'Cyclebreakers', order: 'ascensions', filter: true },
};

const LIMIT = 50;

export async function GET(request) {
  const url = new URL(request.url);
  const boardKey = url.searchParams.get('board') || 'total_level';
  const board = BOARDS[boardKey];
  if (!board) return json({ error: 'unknown_board' }, 400);

  const session = getSession(request);

  try {
    await ensureSchema();
    const sql = db();

    // Ordering column is chosen from a fixed allowlist above — never interpolated
    // from user input, so no injection surface.
    let rows;
    if (boardKey === 'cyclebreakers') {
      rows = await sql`
        SELECT user_id, display_name, avatar_url, total_level, combat_level, shards,
               ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker
        FROM leaderboard WHERE cyclebreaker = true
        ORDER BY ascensions DESC, total_level DESC LIMIT ${LIMIT}`;
    } else if (boardKey === 'shards') {
      rows = await sql`
        SELECT user_id, display_name, avatar_url, total_level, combat_level, shards,
               ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker
        FROM leaderboard ORDER BY shards DESC, total_level DESC LIMIT ${LIMIT}`;
    } else if (boardKey === 'lifetime_gold') {
      rows = await sql`
        SELECT user_id, display_name, avatar_url, total_level, combat_level, shards,
               ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker
        FROM leaderboard ORDER BY lifetime_gold DESC, total_level DESC LIMIT ${LIMIT}`;
    } else if (boardKey === 'boss_kills') {
      rows = await sql`
        SELECT user_id, display_name, avatar_url, total_level, combat_level, shards,
               ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker
        FROM leaderboard ORDER BY boss_kills DESC, total_level DESC LIMIT ${LIMIT}`;
    } else {
      rows = await sql`
        SELECT user_id, display_name, avatar_url, total_level, combat_level, shards,
               ascensions, lifetime_gold, boss_kills, quests_done, cyclebreaker
        FROM leaderboard ORDER BY total_level DESC, lifetime_gold DESC LIMIT ${LIMIT}`;
    }

    const entries = rows.map((r, i) => ({
      rank: i + 1,
      you: session?.userId === r.user_id,
      name: r.display_name,
      avatar: r.avatar_url,
      totalLevel: Number(r.total_level),
      combatLevel: Number(r.combat_level),
      shards: Number(r.shards),
      ascensions: Number(r.ascensions),
      lifetimeGold: Number(r.lifetime_gold),
      bossKills: Number(r.boss_kills),
      questsDone: Number(r.quests_done),
      cyclebreaker: r.cyclebreaker,
    }));

    // The signed-in player's own standing, even if outside the top N
    let self = null;
    if (session) {
      const inList = entries.find(e => e.you);
      if (inList) self = inList;
      else {
        const own = await sql`
          SELECT total_level, combat_level, shards, ascensions, lifetime_gold,
                 boss_kills, quests_done, cyclebreaker, display_name, avatar_url
          FROM leaderboard WHERE user_id = ${session.userId} LIMIT 1`;
        if (own.length) {
          const r = own[0];
          const rankRows = boardKey === 'shards'
            ? await sql`SELECT count(*)::int AS n FROM leaderboard WHERE shards > ${r.shards}`
            : boardKey === 'lifetime_gold'
            ? await sql`SELECT count(*)::int AS n FROM leaderboard WHERE lifetime_gold > ${r.lifetime_gold}`
            : boardKey === 'boss_kills'
            ? await sql`SELECT count(*)::int AS n FROM leaderboard WHERE boss_kills > ${r.boss_kills}`
            : await sql`SELECT count(*)::int AS n FROM leaderboard WHERE total_level > ${r.total_level}`;
          self = {
            rank: (rankRows[0]?.n || 0) + 1,
            you: true,
            name: r.display_name,
            avatar: r.avatar_url,
            totalLevel: Number(r.total_level),
            combatLevel: Number(r.combat_level),
            shards: Number(r.shards),
            ascensions: Number(r.ascensions),
            lifetimeGold: Number(r.lifetime_gold),
            bossKills: Number(r.boss_kills),
            questsDone: Number(r.quests_done),
            cyclebreaker: r.cyclebreaker,
          };
        }
      }
    }

    return json({
      board: boardKey,
      label: board.label,
      boards: Object.entries(BOARDS).map(([k, v]) => ({ key: k, label: v.label })),
      entries,
      self,
    });
  } catch (err) {
    console.error('[leaderboard]', err);
    return json({ error: 'db_error' }, 500);
  }
}
