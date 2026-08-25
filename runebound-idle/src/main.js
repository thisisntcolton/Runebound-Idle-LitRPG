// ============================================================
// RUNEBOUND — entry point
// ============================================================
import { load, save, startAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { processOffline } from './systems/offline.js';
import { initRenderer, showOfflineModal, renderView, queueModal as showOfflineModalQueue } from './ui/render.js';
import { initNotifications, pushLog, popup } from './ui/notify.js';
import { initQuests } from './systems/quests.js';
import { initAchievements, setAchievementUIHooks } from './systems/achievements.js';
import { initCloud } from './core/cloud.js';
import { initTown, townBuff } from './systems/town.js';
import { setNpcUIHooks } from './systems/npcs.js';
import { initPets, petBonus, setPetUIHooks } from './systems/pets.js';
import { initCodex } from './systems/codex.js';
import { initClasses, classBonus, setClassUIHooks } from './systems/classes.js';
import { initEncounters } from './systems/encounters.js';
import { registerTownBuff, registerPetBonus, registerClassBonus } from './core/state.js';
import { emit } from './core/events.js';

const hadSave = load();

// UI + subscriptions first, so offline gains flow through quests & log
// Town must exist and be wired into the multiplier chain before anything
// reads a bonus off it.
initTown();
registerTownBuff(townBuff);

// The Menagerie feeds the same multiplier chain, so it wires up alongside.
initPets();
registerPetBonus(petBonus);

// Your class feeds the same chain, and must be registered before any
// panel reads a derived stat off it.
registerClassBonus(classBonus);

initNotifications();
initRenderer();
initQuests();
setAchievementUIHooks({ popup });
setNpcUIHooks({ queueModal: showOfflineModalQueue, popup });
setPetUIHooks({ queueModal: showOfflineModalQueue, popup });
setClassUIHooks({ queueModal: showOfflineModalQueue, popup });
initAchievements();
initCodex();
initClasses();
initEncounters();

// Offline progress (counts toward quests via events)
const offline = hadSave ? processOffline() : null;
if (offline) {
  showOfflineModal(offline);
  renderView();
}

if (!hadSave) {
  pushLog('sys', '[ SYSTEM ] Initializing… soul detected. Welcome, Adventurer.');
  pushLog('sys', 'Pick a skill on the left and click an action to begin. Your Journal holds your first quest.');
  popup('SYSTEM AWAKENED', '⚔️ Welcome to <b>RUNEBOUND</b><br><span style="font-size:12px;color:var(--text-dim)">Your grind begins now. It never truly ends.</span>', { ttl: 5 });
}

startLoop();
startAutosave();
save();

// Cloud session + save reconciliation (no-op when there's no backend)
initCloud();

// keep lastSeen fresh when tab hides, so offline calc is honest
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
  else {
    const summary = processOffline();
    if (summary) { showOfflineModal(summary); emit('state-changed'); }
  }
});
