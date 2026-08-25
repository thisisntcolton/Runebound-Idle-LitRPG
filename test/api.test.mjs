// ============================================================
// API integration tests — real handlers, real SQL, real Postgres.
// Run: node --import ./test/register.mjs test/api.test.mjs
// ============================================================
import assert from 'node:assert';
import { xpForLevel } from '../src/core/xp.js';

const results = [];
function test(name, fn) { results.push({ name, fn }); }
const req = (url, opts = {}) => new Request(`http://localhost:3000${url}`, opts);

// --- helpers -------------------------------------------------
function cookiesFrom(response) {
  const raw = response.headers.getSetCookie?.() || [];
  return raw.map(c => c.split(';')[0]).join('; ');
}

function makeSave(overrides = {}) {
  return {
    version: 1,
    lastSeen: Date.now(),
    gold: 5000,
    lifetimeGold: 42000,
    shards: 7,
    ascensions: 2,
    skills: {
      woodcutting: { xp: xpForLevel(50) },   // 50
      mining:      { xp: xpForLevel(40) },   // 40
      fishing:     { xp: xpForLevel(30) },   // 30
      smithing:    { xp: xpForLevel(20) },   // 20
      cooking:     { xp: xpForLevel(10) },   // 10
      attack:      { xp: xpForLevel(60) },   // 60
      strength:    { xp: xpForLevel(60) },   // 60
      defense:     { xp: xpForLevel(45) },   // 45
      hitpoints:   { xp: xpForLevel(55) },   // 55
      alchemy:     { xp: xpForLevel(12) },   // 12  → total 382
    },
    stats: { kills: 1200, deaths: 3, actions: 900, bossKills: 4, itemsSold: 50, highestDamage: 88 },
    quests: { completed: { status_awake: true, first_paycheck: true, sharp_edges: true }, progress: {}, seenOffers: {} },
    inventory: { oak_log: 12 },
    ending: null,
    ...overrides,
  };
}

// Test fixtures use dedicated user ids so runs are repeatable and never
// touch real data. Wiped before each run.
const TEST_USERS = ['github:1001', 'google:2002', 'github:3003'];

async function resetFixtures() {
  const { db, ensureSchema } = await import('../api/_lib/db.js');
  await ensureSchema();
  const sql = db();
  for (const id of TEST_USERS) {
    await sql`DELETE FROM leaderboard WHERE user_id = ${id}`;
    await sql`DELETE FROM saves WHERE user_id = ${id}`;
    await sql`DELETE FROM users WHERE id = ${id}`;
  }
}

// =============================================================
test('validate: rejects non-objects and oversized saves', async () => {
  const { validateSave } = await import('../api/_lib/validate.js');
  assert.equal(validateSave(null).ok, false);
  assert.equal(validateSave('nope').ok, false);
  assert.equal(validateSave([]).ok, false);
  assert.equal(validateSave({}).ok, false, 'save with no skills must fail');

  const huge = makeSave({ junk: 'x'.repeat(600 * 1024) });
  const res = validateSave(huge);
  assert.equal(res.ok, false);
  assert.match(res.error, /too large/);
});

test('validate: derives total level from XP, not from client claims', async () => {
  const { validateSave } = await import('../api/_lib/validate.js');
  // Client lies about its standing in every way it can
  const cheeky = makeSave({ totalLevel: 891, combatLevel: 999, derived: { totalLevel: 891 } });
  const res = validateSave(cheeky);
  assert.equal(res.ok, true);
  assert.equal(res.derived.totalLevel, 382, 'total level must be recomputed from raw XP');
  assert.equal(res.derived.combatLevel, Math.floor((60 + 60 + 45 + 55) / 3));
  assert.equal(res.derived.questsDone, 3);
  assert.equal(res.derived.cyclebreaker, false);
});

test('validate: clamps negative / infinite / absurd numbers', async () => {
  const { validateSave } = await import('../api/_lib/validate.js');
  const nasty = makeSave({
    gold: -999,
    lifetimeGold: Infinity,
    shards: 1e30,
    ascensions: NaN,
    skills: { ...makeSave().skills, mining: { xp: -50 } },
  });
  const res = validateSave(nasty);
  assert.equal(res.ok, true);
  assert.equal(res.save.gold, 0, 'negative gold clamps to 0');
  assert.ok(Number.isFinite(res.save.lifetimeGold), 'Infinity is rejected');
  assert.ok(res.save.shards <= 1e9, 'absurd shards are capped');
  assert.equal(res.save.ascensions, 0, 'NaN clamps to 0');
  assert.equal(res.save.skills.mining.xp, 0, 'negative xp clamps to 0');
});

test('validate: flags the Cyclebreaker ending', async () => {
  const { validateSave } = await import('../api/_lib/validate.js');
  const res = validateSave(makeSave({ ending: 'broken' }));
  assert.equal(res.derived.cyclebreaker, true);
});

test('validate: accepts known titles, strips invented ones', async () => {
  const { validateSave } = await import('../api/_lib/validate.js');
  const legit = validateSave(makeSave({ activeTitle: 'Cyclebreaker' }));
  assert.equal(legit.derived.title, 'Cyclebreaker');
  const forged = validateSave(makeSave({ activeTitle: 'Supreme Leader of the Database' }));
  assert.equal(forged.derived.title, null, 'made-up titles are stripped');
  const none = validateSave(makeSave());
  assert.equal(none.derived.title, null);
});

test('session: signed tokens round-trip and reject tampering', async () => {
  const { encodeToken, decodeToken } = await import('../api/_lib/session.js');
  const token = encodeToken({ uid: 'github:123', iat: Math.floor(Date.now() / 1000) });
  assert.equal(decodeToken(token).uid, 'github:123');

  const [body] = token.split('.');
  assert.equal(decodeToken(`${body}.forgedsignature`), null, 'bad signature rejected');
  assert.equal(decodeToken('garbage'), null);
  assert.equal(decodeToken(null), null);

  const expired = encodeToken({ uid: 'x', iat: Math.floor(Date.now() / 1000) - 99999 });
  assert.equal(decodeToken(expired, 60), null, 'expired token rejected');
});

test('auth: login redirects to provider with signed state + nonce cookie', async () => {
  const { GET } = await import('../api/auth/login.js');
  const res = await GET(req('/api/auth/login?provider=github'));
  assert.equal(res.status, 302);

  const loc = new URL(res.headers.get('location'));
  assert.equal(loc.origin + loc.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(loc.searchParams.get('client_id'), 'test-github-id');
  assert.equal(loc.searchParams.get('redirect_uri'), 'http://localhost:3000/api/auth/callback');
  assert.equal(loc.searchParams.get('response_type'), 'code');
  assert.ok(loc.searchParams.get('state'), 'state present');
  assert.match(res.headers.get('set-cookie'), /rb_oauth=/, 'CSRF nonce cookie set');

  // state must decode to the right provider
  const { decodeToken } = await import('../api/_lib/session.js');
  assert.equal(decodeToken(loc.searchParams.get('state'), 600).p, 'github');
});

test('auth: login rejects unknown / unconfigured providers', async () => {
  const { GET } = await import('../api/auth/login.js');
  const res = await GET(req('/api/auth/login?provider=myspace'));
  assert.equal(res.status, 400);
});

test('auth: callback rejects a mismatched CSRF nonce', async () => {
  const { GET } = await import('../api/auth/callback.js');
  const { encodeToken } = await import('../api/_lib/session.js');
  const state = encodeToken({ p: 'github', n: 'the-real-nonce', iat: Math.floor(Date.now() / 1000) });
  const res = await GET(req(`/api/auth/callback?code=abc&state=${state}`, {
    headers: { cookie: 'rb_oauth=a-different-nonce' },
  }));
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /auth_error=state_mismatch/);
});

test('auth: callback rejects a forged state token', async () => {
  const { GET } = await import('../api/auth/callback.js');
  const res = await GET(req('/api/auth/callback?code=abc&state=totally.forged', {
    headers: { cookie: 'rb_oauth=whatever' },
  }));
  assert.match(res.headers.get('location'), /auth_error=bad_state/);
});

test('me: returns null user when signed out, lists configured providers', async () => {
  const { GET } = await import('../api/me.js');
  const res = await GET(req('/api/me'));
  const data = await res.json();
  assert.equal(data.user, null);
  assert.deepEqual(data.providers.sort(), ['github', 'google']);
});

test('save: requires authentication', async () => {
  const { GET, POST } = await import('../api/save.js');
  assert.equal((await GET(req('/api/save'))).status, 401);
  assert.equal((await POST(req('/api/save', { method: 'POST', body: '{}' }))).status, 401);
});

test('save + leaderboard: full round-trip with a real user', async () => {
  const { db, ensureSchema } = await import('../api/_lib/db.js');
  const { sessionCookie } = await import('../api/_lib/session.js');
  const savedApi = await import('../api/save.js');
  const lbApi = await import('../api/leaderboard.js');
  const meApi = await import('../api/me.js');

  await ensureSchema();
  const sql = db();
  const userId = 'github:1001';
  await sql`INSERT INTO users (id, provider, provider_id, display_name, avatar_url)
            VALUES (${userId}, 'github', '1001', 'Testfang the Bold', null)
            ON CONFLICT (id) DO NOTHING`;

  const cookie = sessionCookie({ id: userId }).split(';')[0];
  const auth = { cookie };

  // /api/me now resolves the user
  const meData = await (await meApi.GET(req('/api/me', { headers: auth }))).json();
  assert.equal(meData.user.name, 'Testfang the Bold');

  // No save yet
  let getRes = await savedApi.GET(req('/api/save', { headers: auth }));
  assert.equal((await getRes.json()).save, null);

  // Push a save
  const postRes = await savedApi.POST(req('/api/save', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ save: makeSave({ totalLevel: 891 }) }),
  }));
  const postData = await postRes.json();
  assert.equal(postRes.status, 200);
  assert.equal(postData.ok, true);
  assert.equal(postData.summary.totalLevel, 382, 'server-derived, ignoring the claimed 891');

  // Pull it back
  getRes = await savedApi.GET(req('/api/save', { headers: auth }));
  const loaded = await getRes.json();
  assert.equal(loaded.save.gold, 5000);
  assert.equal(loaded.save.inventory.oak_log, 12);
  assert.ok(loaded.clientUpdatedAt > 0, 'client timestamp persisted');

  // Leaderboard reflects derived values and marks "you"
  const lbData = await (await lbApi.GET(req('/api/leaderboard?board=total_level', { headers: auth }))).json();
  const me = lbData.entries.find(e => e.you);
  assert.ok(me, 'signed-in player appears on the board');
  assert.equal(me.name, 'Testfang the Bold');
  assert.equal(me.totalLevel, 382);
  assert.equal(me.shards, 7);
  assert.equal(me.bossKills, 4);
  assert.equal(me.questsDone, 3);
});

test('save: throttles rapid writes', async () => {
  const { sessionCookie } = await import('../api/_lib/session.js');
  const savedApi = await import('../api/save.js');
  const cookie = sessionCookie({ id: 'github:1001' }).split(';')[0];
  const res = await savedApi.POST(req('/api/save', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ save: makeSave() }),   // no force → should be throttled
  }));
  assert.equal(res.status, 429);
  assert.equal((await res.json()).throttled, true);
});

test('save: rejects malformed bodies', async () => {
  const { sessionCookie } = await import('../api/_lib/session.js');
  const savedApi = await import('../api/save.js');
  const cookie = sessionCookie({ id: 'github:1001' }).split(';')[0];

  const badJson = await savedApi.POST(req('/api/save', {
    method: 'POST', headers: { cookie }, body: 'not json at all',
  }));
  assert.equal(badJson.status, 400);

  const noSkills = await savedApi.POST(req('/api/save', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ save: { gold: 1 }, force: true }),
  }));
  assert.equal(noSkills.status, 400);
});

test('leaderboard: ranks multiple players and supports every board', async () => {
  const { db } = await import('../api/_lib/db.js');
  const { sessionCookie } = await import('../api/_lib/session.js');
  const savedApi = await import('../api/save.js');
  const lbApi = await import('../api/leaderboard.js');
  const sql = db();

  // A stronger rival, and a Cyclebreaker
  const rivals = [
    { id: 'google:2002', name: 'Ashwalker', save: makeSave({
        skills: Object.fromEntries(Object.keys(makeSave().skills).map(k => [k, { xp: xpForLevel(80) }])),
        shards: 40, lifetimeGold: 9_000_000, stats: { bossKills: 90 } }) },
    { id: 'github:3003', name: 'Nine', save: makeSave({ ending: 'broken', ascensions: 9, shards: 25 }) },
  ];
  for (const r of rivals) {
    await sql`INSERT INTO users (id, provider, provider_id, display_name)
              VALUES (${r.id}, ${r.id.split(':')[0]}, ${r.id.split(':')[1]}, ${r.name})
              ON CONFLICT (id) DO NOTHING`;
    const cookie = sessionCookie({ id: r.id }).split(';')[0];
    const res = await savedApi.POST(req('/api/save', {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ save: r.save, force: true }),
    }));
    assert.equal(res.status, 200, `${r.name} save should succeed`);
  }

  const byLevel = await (await lbApi.GET(req('/api/leaderboard?board=total_level'))).json();
  assert.equal(byLevel.entries[0].name, 'Ashwalker', 'highest total level ranks first');
  assert.equal(byLevel.entries[0].rank, 1);
  assert.ok(byLevel.entries.length >= 3);

  const byGold = await (await lbApi.GET(req('/api/leaderboard?board=lifetime_gold'))).json();
  assert.equal(byGold.entries[0].name, 'Ashwalker');

  const breakers = await (await lbApi.GET(req('/api/leaderboard?board=cyclebreakers'))).json();
  assert.equal(breakers.entries.length, 1, 'only Cyclebreakers listed');
  assert.equal(breakers.entries[0].name, 'Nine');
  assert.equal(breakers.entries[0].cyclebreaker, true);

  for (const board of ['shards', 'boss_kills']) {
    const res = await lbApi.GET(req(`/api/leaderboard?board=${board}`));
    assert.equal(res.status, 200, `${board} board loads`);
  }

  const bad = await lbApi.GET(req('/api/leaderboard?board=DROP TABLE users'));
  assert.equal(bad.status, 400, 'unknown board rejected');

  // tables intact
  const check = await sql`SELECT count(*)::int AS n FROM users`;
  assert.ok(check[0].n >= 3, 'users table survived');
});

test('leaderboard: reports the players own rank when outside the top list', async () => {
  const { sessionCookie } = await import('../api/_lib/session.js');
  const lbApi = await import('../api/leaderboard.js');
  const cookie = sessionCookie({ id: 'github:1001' }).split(';')[0];
  const data = await (await lbApi.GET(req('/api/leaderboard?board=total_level', { headers: { cookie } }))).json();
  assert.ok(data.self, 'self standing included');
  assert.equal(data.self.you, true);
  assert.ok(data.self.rank >= 1);
});

test('save: DELETE clears cloud save and leaderboard entry', async () => {
  const { db } = await import('../api/_lib/db.js');
  const { sessionCookie } = await import('../api/_lib/session.js');
  const savedApi = await import('../api/save.js');
  const cookie = sessionCookie({ id: 'github:3003' }).split(';')[0];

  const res = await savedApi.DELETE(req('/api/save', { method: 'DELETE', headers: { cookie } }));
  assert.equal(res.status, 200);

  const sql = db();
  const rows = await sql`SELECT * FROM saves WHERE user_id = 'github:3003'`;
  assert.equal(rows.length, 0);
  const lb = await sql`SELECT * FROM leaderboard WHERE user_id = 'github:3003'`;
  assert.equal(lb.length, 0);
});

test('logout clears the session cookie', async () => {
  const { POST } = await import('../api/auth/logout.js');
  const res = await POST(req('/api/auth/logout', { method: 'POST' }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie'), /rb_session=;/);
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
});

// =============================================================
await resetFixtures();

let pass = 0, fail = 0;
for (const { name, fn } of results) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    pass++;
  } catch (err) {
    console.log(`  ✗ ${name}\n      ${err.message}`);
    fail++;
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
const { closePool } = await import('./neon-shim.mjs');
await closePool();
process.exit(fail ? 1 : 0);
