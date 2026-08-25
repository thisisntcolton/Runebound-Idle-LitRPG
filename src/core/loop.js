// ============================================================
// MAIN GAME LOOP — 10 ticks/second, catch-up on lag
// ============================================================
import { tickActiveSkill, tickHirelings } from '../systems/skills.js';
import { tickCombat } from '../systems/combat.js';
import { cleanupBuffs } from '../systems/potions.js';
import { emit } from './events.js';

let buffSweep = 0;

const TICK_MS = 100;
const MAX_CATCHUP_MS = 5000; // longer gaps are handled by offline progress on reload

let last = performance.now();

export function startLoop() {
  last = performance.now();
  setInterval(() => {
    const now = performance.now();
    let dt = now - last;
    last = now;
    if (dt <= 0) return;
    if (dt > MAX_CATCHUP_MS) dt = MAX_CATCHUP_MS;

    tickActiveSkill(dt);
    tickHirelings(dt);
    tickCombat(dt);
    buffSweep += dt;
    if (buffSweep > 5000) { buffSweep = 0; cleanupBuffs(); }
    emit('tick', { dt });
  }, TICK_MS);
}
