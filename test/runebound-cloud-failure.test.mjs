import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, state } from '../src/core/state.js';
import { load } from '../src/core/save.js';
import { initCloud, cloud, pushCloudSave } from '../src/core/cloud.js';

const key = 'runebound-save-v1';
const data = new Map([[key, '{bad']]);
globalThis.localStorage = {
  getItem: k => data.get(k) ?? null,
  setItem(k, v) { if (k === key) throw new Error('storage full'); data.set(k, String(v)); },
  removeItem: k => data.delete(k),
};
globalThis.document = { visibilityState: 'visible' };
globalThis.window = { location: { search: '', pathname: '/runebound.html' }, history: { replaceState() {} } };
const remote = defaultState();
remote.gold = remote.lifetimeGold = 900;
let posts = 0;
globalThis.fetch = async (path, options = {}) => {
  if (options.method === 'POST') posts++;
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => path === '/api/me' ? { user: { name: 'Tester' } } : { save: remote, clientUpdatedAt: 1 } };
};

test('failed cloud restore preserves both saves and blocks upload', async () => {
  assert.equal(load(), false);
  const previous = state.gold;
  const originalSetInterval = globalThis.setInterval;
  globalThis.setInterval = () => 0;
  try { await initCloud(); } finally { globalThis.setInterval = originalSetInterval; }
  assert.equal(state.gold, previous);
  assert.equal(data.get(key), '{bad');
  assert.ok(cloud.lastError);
  assert.equal(await pushCloudSave({ force: true }), false);
  assert.equal(posts, 0);
});
