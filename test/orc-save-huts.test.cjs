const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const cache = new Map();
function loadModule(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('exports', 'require', code)(exports, name => name.startsWith('.') ? loadModule(path.resolve(path.dirname(file), name + '.ts')) : require(name));
  return exports;
}
let raw = null;
global.localStorage = { getItem: () => raw, setItem: (_, value) => { raw = value; }, removeItem: () => { raw = null; } };
const { SaveSystem } = loadModule('src/orcvillage/systems/SaveSystem.ts');
const stock = { wood: 3, stone: 4, iron: 5, food: 6 };
const old = { version: 2, storage: stock, inventory: stock, axeLevel: 1, pickaxeLevel: 1, x: 180, y: 230, built: [], workers: stock, story: { fire: true, urga: true, hall: 2, huts: 2, hutLevels: [3, 5], harvests: stock, production: 0, elapsed: 0, entries: ['Memory'] }, wild: { region: 4, huts: [3, 5], respawns: {}, discovered: [4, 9] } };
raw = JSON.stringify(old);
const loaded = SaveSystem.load();
assert.deepEqual(loaded.story.hutLevels, [3, 5]);
assert.deepEqual(loaded.wild.huts, [3, 5]);
assert.deepEqual(loaded.wild.discovered, [4, 9]);
assert.equal(SaveSystem.save(loaded), true);
assert.deepEqual(SaveSystem.load().story.hutLevels, [3, 5]);
delete old.story.hutLevels;
raw = JSON.stringify(old);
assert.equal(SaveSystem.load().story.hutLevels, undefined);
console.log('Hut save migration assertions passed');
