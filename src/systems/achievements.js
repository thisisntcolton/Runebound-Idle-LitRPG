// ============================================================
// ACHIEVEMENT ENGINE — checks conditions on game events,
// grants achievements + titles, feeds the popup system.
// ============================================================
import { state, skillLevel, totalSkillLevel, combatLevel, charLevel,
         uncappedSkillLevel } from '../core/state.js';
import { getSpecies } from '../data/pets.js';
import { masteredClasses } from './classes.js';
import { ACHIEVEMENTS, TITLE_SET } from '../data/achievements.js';
import { SKILL_IDS } from '../data/skills.js';
import { on, emit } from '../core/events.js';

let hooks = { popup: () => {} };
export function setAchievementUIHooks(h) { hooks = h; }

function ctx() {
  return {
    state,
    level: skillLevel,
    totalLevel: totalSkillLevel(),
    combatLevel: combatLevel(),
    charLevel: charLevel(),
    anySkillAtLeast: n => SKILL_IDS.some(id => skillLevel(id) >= n),
    // The true level, ignoring the Era I ceiling — an achievement for
    // passing 99 has to see the XP that is being held back, or it could
    // never fire for the player it is written about.
    uncapped: uncappedSkillLevel,
    speciesRarity: id => getSpecies(id)?.rarity,
    masteries: masteredClasses().length,
    talentRanks: Object.values(state.classProgress || {})
      .reduce((sum, p) => sum + Object.values(p?.spent || {})
        .reduce((s, n) => s + (n || 0), 0), 0),
  };
}

export function checkAchievements() {
  const c = ctx();
  let newly = 0;
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.cond(c); } catch { ok = false; }
    if (!ok) continue;

    state.achievements[a.id] = Date.now();
    newly++;
    emit('notify', { type: 'loot', text: `🏅 [ ACHIEVEMENT ] ${a.name} — ${a.desc}` });
    hooks.popup('ACHIEVEMENT', `${a.icon} <b>${a.name}</b><br><span style="font-size:12px;color:var(--text-dim)">${a.desc}</span>`, { gold: true, ttl: 4 });
    if (a.title) {
      emit('notify', { type: 'sys', text: `[ SYSTEM ] Title unlocked: "${a.title}" — equip it on your Character Sheet.` });
      if (!state.activeTitle) state.activeTitle = a.title; // auto-equip first title
    }
    emit('achievement', { id: a.id });
  }
  if (newly > 0) emit('state-changed');
}

export function unlockedTitles() {
  return ACHIEVEMENTS
    .filter(a => a.title && state.achievements[a.id])
    .map(a => a.title);
}

export function setTitle(title) {
  if (title !== null && (!TITLE_SET.has(title) || !unlockedTitles().includes(title))) return false;
  state.activeTitle = title;
  emit('notify', { type: 'sys', text: title
    ? `[ SYSTEM ] You are now "${title}". The leaderboard has been notified.`
    : '[ SYSTEM ] Title removed. Very humble.' });
  emit('state-changed');
  return true;
}

export function achievementProgress() {
  const total = ACHIEVEMENTS.length;
  const done = Object.keys(state.achievements).length;
  return { done, total };
}

export function initAchievements() {
  // Cheap re-checks on the events that can change conditions.
  for (const ev of ['kill', 'level-up', 'char-level', 'gold', 'quest-complete',
                    'ascended', 'death', 'dungeon-complete', 'enchanted',
                    'potion-drunk', 'hireling-hired', 'action-done']) {
    on(ev, checkAchievements);
  }
  // Catch anything the events missed (e.g. migrated saves) shortly after boot.
  setTimeout(checkAchievements, 2000);
  setInterval(checkAchievements, 60_000);
}
