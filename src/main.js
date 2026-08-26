// ============================================================
// RUNEBOUND — entry point
// ============================================================
import { load, save, startAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { processOffline } from './systems/offline.js';
import { initRenderer, showOfflineModal, renderView, applyEra, queueModal as showOfflineModalQueue } from './ui/render.js';
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
import { initSalvage, setSalvageUIHooks } from './systems/salvage.js';
import { initRepo, setRepoUIHooks, repoPenalty } from './systems/repo.js';
import { initDeep, setDeepUIHooks, deepBonus } from './systems/deep.js';
import { initSkills, setSkillUIHooks } from './systems/skills.js';
import { initCombat } from './systems/combat.js';
import { initAdventure, setAdventureUIHooks } from './systems/adventure.js';
import { initBoss, setBossUIHooks, bossBonus } from './systems/worldboss.js';
import { abilityBonus } from './systems/abilities.js';
import { setLedgerUIHooks, ledgerBonus, initLedger } from './systems/ledger.js';
import { registerTownBuff, registerPetBonus, registerClassBonus, registerLedgerBonus,
         registerRepoPenalty, registerDeepBonus, registerBossBonus,
         registerAbilityBonus } from './core/state.js';
import { emit } from './core/events.js';
import { buildLabel, buildInfo } from './core/build.js';

// Before anything else, say what this page is. If a deploy ever goes
// sideways again, the answer is on screen and in the console rather than
// inferred from a dashboard.
{
  const stamp = document.getElementById('build-stamp');
  if (stamp) stamp.textContent = buildLabel();
  window.__RUNEBOUND_BUILD__ = buildInfo();
  console.info('[Runebound] build', buildLabel(), buildInfo());
}

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
registerLedgerBonus(ledgerBonus);
registerRepoPenalty(repoPenalty);
registerDeepBonus(deepBonus);
registerBossBonus(bossBonus);
registerAbilityBonus(abilityBonus);

initNotifications();
initRenderer();
initQuests();
setAchievementUIHooks({ popup });
setNpcUIHooks({ queueModal: showOfflineModalQueue, popup });
setPetUIHooks({ queueModal: showOfflineModalQueue, popup });
setClassUIHooks({ queueModal: showOfflineModalQueue, popup });
setSalvageUIHooks({ queueModal: showOfflineModalQueue, popup });
setRepoUIHooks({ queueModal: showOfflineModalQueue, popup });
setLedgerUIHooks({ queueModal: showOfflineModalQueue, popup });
setDeepUIHooks({ queueModal: showOfflineModalQueue, popup });
setBossUIHooks({ queueModal: showOfflineModalQueue, popup });
setSkillUIHooks({ queueModal: showOfflineModalQueue });
setAdventureUIHooks({ queueModal: showOfflineModalQueue, popup });
initAchievements();
initCodex();
initClasses();
initEncounters();
initSalvage();
initRepo();
initDeep();
initBoss();
initSkills();
initCombat();
initAdventure();
initLedger();

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
