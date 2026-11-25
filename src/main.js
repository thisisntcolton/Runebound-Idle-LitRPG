// ============================================================
// RUNEBOUND — entry point
// ============================================================
import { state } from "./core/state.js";
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
import { emit, on } from './core/events.js';
import { homeBonus as _homeBonus } from './systems/home.js';
import { legacyRate as _legacyRate } from './systems/legacy.js';
import { registerHomeBonus, registerLegacyRate } from './core/state.js';
import { tickExpedition, initExpeditions, setExpeditionUIHooks } from './systems/expeditions.js';
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

// The house and the household both feed the same multiplier chain as
// everything else, registered lazily for the usual reason: they read
// state, so importing them from core/state.js would be a cycle.
registerHomeBonus(_homeBonus);
registerLegacyRate(_legacyRate);

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

// A party out past the gate comes home on the wall clock, so this has to
// run on load as well as on the tick — an expedition that finished while
// the tab was closed should be waiting at the gate, not still walking.
setExpeditionUIHooks({ queueModal: showOfflineModalQueue });
initExpeditions();
tickExpedition();

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

startLoop(dt => {
  const summary = processOffline(dt / 1000);
  if (summary) { showOfflineModal(summary); emit("state-changed"); }
  save();
});
startAutosave();
save();

// Cloud session + save reconciliation (no-op when there's no backend)
initCloud();

// Publish this town so other people can visit it, and pick up anything
// left on the doorstep. Both are best-effort and silent on failure — a
// player with no backend should never see an error about a feature they
// have not been offered.
import('./systems/visiting.js').then(({ publish, loadGifts }) => {
  setTimeout(() => { publish(); loadGifts(); }, 4000);
  on('ascended', () => publish({ force: true }));
});

// keep lastSeen fresh when tab hides, so offline calc is honest
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    state.lastSeen = Date.now();
    save();
  }
  else {
    const summary = processOffline();
    if (summary) { showOfflineModal(summary); emit('state-changed'); }
    save();
  }
});
