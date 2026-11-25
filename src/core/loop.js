// ============================================================
// MAIN GAME LOOP — 10 ticks/second, catch-up on lag
// ============================================================
import { tickActiveSkill, tickHirelings } from '../systems/skills.js';
import { tickCombat } from '../systems/combat.js';
import { cleanupBuffs } from '../systems/potions.js';
import { tickAbilities } from '../systems/abilities.js';
import { tickTown } from '../systems/town.js';
import { tickUnstable } from '../systems/unstable.js';
import { tickNpcs } from '../systems/npcs.js';
import { tickPets } from '../systems/pets.js';
import { tickCodex } from '../systems/codex.js';
import { tickEncounters } from '../systems/encounters.js';
import { tickSalvage } from '../systems/salvage.js';
import { tickRepo } from '../systems/repo.js';
import { tickLedger } from '../systems/ledger.js';
import { tickBoss } from '../systems/worldboss.js';
import { tickAdventure } from '../systems/adventure.js';
import { emit } from './events.js';

let buffSweep = 0;
let npcSweep = 0;

const TICK_MS = 100;
const MAX_CATCHUP_MS = 5000; // longer gaps are handled by offline progress on reload

let last = performance.now();

export function startLoop(onGap = () => {}) {
  last = performance.now();
  document.addEventListener("visibilitychange", () => { last = performance.now(); });
  setInterval(() => {
    const now = performance.now();
    let dt = now - last;
    last = now;
    if (document.visibilityState === "hidden" || dt <= 0) return;
    if (dt > MAX_CATCHUP_MS) { onGap(dt); return; }

    tickActiveSkill(dt);
    tickHirelings(dt);
    tickCombat(dt);
    tickAbilities(dt);
    tickTown(dt);
    tickUnstable(dt);
    tickPets(dt);
    tickCodex(dt);
    tickSalvage(dt);
    tickLedger(dt);
    tickBoss(dt);
    tickAdventure(dt);
    npcSweep += dt;
    if (npcSweep > 4000) { npcSweep = 0; tickNpcs(); tickEncounters(); tickRepo(); }
    buffSweep += dt;
    if (buffSweep > 5000) { buffSweep = 0; cleanupBuffs(); }
    emit('tick', { dt });
  }, TICK_MS);
}
