import { levelForXp } from '../core/xp.js';
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const num = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const timestamp = value => num(value) && value > 0 && value <= Date.now() ? value : null;
export function readSave(key, storage = localStorage) { try { const value = JSON.parse(storage.getItem(key)); return object(value) ? value : null; } catch { return null; } }
export function runebound(s) {
  if (!object(s?.skills)) return null;
  const summary = [];
  if (typeof s.look?.name === 'string' && s.look.name.trim()) summary.push(s.look.name.trim());
  const skills = Object.values(s.skills).filter(x => object(x) && num(x.xp));
  if (skills.length) summary.push(`Total level ${skills.reduce((n,x) => n + levelForXp(x.xp), 0)}`);
  return { summary, lastPlayed: timestamp(s.lastSeen) };
}
export function lineage(s) {
  if (!object(s?.character)) return null;
  const c = s.character, summary = [];
  const name = [c.firstName,c.lastName].filter(x => typeof x === 'string' && x.trim()).join(' ');
  if (name) summary.push(name);
  if (num(c.age)) summary.push(c.alive === false ? `Passed at ${c.age}` : `Age ${c.age}`);
  if (num(s.dynasty?.generation) && s.dynasty.generation > 0) summary.push(`Generation ${s.dynasty.generation}`);
  return { summary, lastPlayed: timestamp(s.lastSeen) };
}
export function guild(s) {
  const types = ['Fighter','Cleric','Ranger','Wizard','Rogue'];
  if (s?.version !== 1 || !Array.isArray(s.heroes) || !Array.isArray(s.party) || !s.heroes.every(h => object(h) && types.includes(h.type))) return null;
  return { summary: [`${s.heroes.length} adventurer${s.heroes.length === 1 ? '' : 's'}`], lastPlayed: timestamp(s.lastSeen) };
}
export function blackroot(s) {
  if (!object(s) || ![1,2].includes(s.version)) return null;
  const summary = ['Gruk'];
  if (Number.isSafeInteger(s.axeLevel) && s.axeLevel > 0) summary.push(`Axe level ${s.axeLevel}`);
  if (num(s.wild?.gold)) summary.push(`${s.wild.gold.toLocaleString()} gold`);
  if (object(s.wild?.fishCaught)) summary.push(`${Object.values(s.wild.fishCaught).filter(x => num(x) && x > 0).length} fish discovered`);
  return { summary, lastPlayed: null };
}
