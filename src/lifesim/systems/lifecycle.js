import {refreshAchievements} from './paths.js';
import { initLife, finance, annualLife, lifeOptions, syncChildren } from './life.js';
// ============================================================
// LINEAGE — 3-Beat Yearly Flow, Energy Pool, Hidden Strain & Routines
//
// Beat 1 (Start of Year): Age advances, next year's Energy pool is
//   computed from Age + Health + Strain + Recovery + Traits, and 1–2
//   start-of-year events land.
// Beat 2 (Spend Energy): Player spends Energy on actions (or triggers a
//   1-click Routine / Repeat Last Year).
// Beat 3 (End of Year): Unspent energy automatically converts into Rest,
//   milestones (promotions, honors, burnout, side-hustle mastery) resolve,
//   a clean summary writes to the Life Log, and the next year begins!
// ============================================================
import { state, stageForAge, clampStat } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { getBackground, getTrait, rollDraftCharacter, FIRST_NAMES, pickRandom } from '../data/traits.js';
import { LIFE_EVENTS } from '../data/events.js';
import { getActionById, getActionsForCharacter } from '../data/actions.js';

export function ensureDraft(overrides = {}) {
  if (!state.draft) {
    state.draft = rollDraftCharacter(overrides);
  }
  return state.draft;
}

export function rerollDraft(keepNames = false) {
  const prev = state.draft || {};
  state.draft = rollDraftCharacter(
    keepNames ? { firstName: prev.firstName, lastName: prev.lastName, birthYear: prev.birthYear, appearance: prev.appearance } : {}
  );
  if(keepNames)state.draft.appearance=prev.appearance;
  saveGame();
}

// Aggregate passive modifiers from a character's starting traits
export function traitPassives(c) {
  const agg = {
    smartsGainMult: 1,
    healthLossMult: 1,
    happyLossMult: 1,
    happyBaseline: 0,
    looksDecayMult: 1,
    riskBonus: 0,
    incomeMult: 1,
    incomeBonus: 0,
    smartsFloor: 0,
    energyBonus: 0,
    strainGainMult: 1,
    strainRecoveryMult: 1,
  };
  for (const tid of c?.traits || []) {
    const p = getTrait(tid)?.passive;
    if (!p) continue;
    if (p.smartsGainMult) agg.smartsGainMult *= p.smartsGainMult;
    if (p.healthLossMult) agg.healthLossMult *= p.healthLossMult;
    if (p.happyLossMult) agg.happyLossMult *= p.happyLossMult;
    if (p.happyBaseline) agg.happyBaseline += p.happyBaseline;
    if (p.looksDecayMult) agg.looksDecayMult *= p.looksDecayMult;
    if (p.riskBonus) agg.riskBonus += p.riskBonus;
    if (p.incomeMult) agg.incomeMult *= p.incomeMult;
    if (p.incomeBonus) agg.incomeBonus += p.incomeBonus;
    if (p.smartsFloor) agg.smartsFloor = Math.max(agg.smartsFloor, p.smartsFloor);
    if (p.energyBonus) agg.energyBonus += p.energyBonus;
    if (p.strainGainMult) agg.strainGainMult *= p.strainGainMult;
    if (p.strainRecoveryMult) agg.strainRecoveryMult *= p.strainRecoveryMult;
  }
  return agg;
}

// Qualitative hint of hidden Strain (the raw 0-100 meter stays hidden under the hood!)
export function strainOutlook(c) {
  const s = c?.strain || 0;
  if (s >= 80) return { label: '🔥 Frayed to the Bone', tone: 'danger', tip: 'Severe hidden strain is slashing your yearly energy and risking burnout! Rest, exercise, or take a vacation.' };
  if (s >= 58) return { label: '😮‍💨 Worn Thin', tone: 'warn', tip: 'Heavy workload is eating into next year’s energy pool (-2 Energy).' };
  if (s >= 35) return { label: '⚡ Stretched', tone: 'mild', tip: 'Starting to feel the grind (-1 Energy next year unless you unwind).' };
  if (s <= 10) return { label: '🌿 Fresh & Rested', tone: 'good', tip: 'Well-recovered and clear-headed!' };
  return { label: '🙂 Steady', tone: 'ok', tip: 'Pace is sustainable.' };
}

// Compute a character's Energy pool + transparent breakdown for the new year
export function computeYearEnergyPool(c) {
  const p = traitPassives(c);
  const age = c.age;

  // Age curve: Baby sparse, Child growing, Teen high, Prime Adult peaks at 10, Elder tapers
  let ageBase = 10;
  if (age === 0) ageBase = 2;
  else if (age <= 4) ageBase = 3;
  else if (age <= 8) ageBase = 5;
  else if (age <= 12) ageBase = 6;
  else if (age <= 17) ageBase = 8;
  else if (age <= 52) ageBase = 10;
  else if (age <= 64) ageBase = 9;
  else if (age <= 75) ageBase = 8;
  else if (age <= 85) ageBase = 6;
  else ageBase = 5;

  // Low Health shrinks the pool; vibrant Health (88%+) doesn't inflate past cap
  let healthMod = 0;
  if (c.stats.health < 25) healthMod = -3;
  else if (c.stats.health < 45) healthMod = -2;
  else if (c.stats.health < 62) healthMod = -1;

  // Hidden Strain penalty ("grind, grind, grind -> burn out")
  const strain = c.strain || 0;
  let strainMod = 0;
  if (strain >= 85) strainMod = -4;
  else if (strain >= 65) strainMod = -3;
  else if (strain >= 45) strainMod = -2;
  else if (strain >= 30) strainMod = -1;

  // Recovery carry-over bonus from Vacation / Mindfulness / deep rest
  const recoveryMod = Math.min(2, c.nextEnergyBonus || 0);

  // Trait modifier (scaled gently for babies so infants don't get weird numbers)
  const traitMod = age <= 4 ? 0 : p.energyBonus;

  const minFloor = age <= 4 ? 2 : 3;
  const total = Math.max(minFloor, ageBase + healthMod + strainMod + recoveryMod + traitMod);

  return {
    total,
    ageBase,
    healthMod,
    strainMod,
    recoveryMod,
    traitMod,
  };
}

// Apply a stat delta with trait scaling + diminishing returns near the cap
export function applyStatDelta(c, key, rawDelta) {
  if (!rawDelta || !(key in c.stats)) return 0;
  const p = traitPassives(c);
  const cur = c.stats[key];
  let d = rawDelta;

  if (key === 'smarts' && d > 0) d *= p.smartsGainMult;
  if (key === 'health' && d < 0) d *= p.healthLossMult;
  if (key === 'happiness' && d < 0) d *= p.happyLossMult;

  if (d > 0) {
    if (cur >= 88) d *= 0.35;
    else if (cur >= 75) d *= 0.62;
    if (key === 'smarts' || key === 'looks') {
      // Stochastic rounding preserves small gains without guaranteeing +1 per action.
      if (cur >= 95) d *= 0.25;
      else if (cur >= 88) d *= 0.5;
      const whole = Math.floor(d);
      d = whole + (Math.random() < d - whole ? 1 : 0);
    } else d = Math.max(1, Math.round(d));
  } else {
    d = Math.min(-1, Math.round(d));
  }

  const next = clampStat(cur + d);
  const actual = next - cur;
  c.stats[key] = next;
  return actual;
}

function applyStrainDelta(c, rawStrain) {
  if (!rawStrain) return;
  const p = traitPassives(c);
  const scaled = rawStrain > 0
    ? rawStrain * p.strainGainMult
    : rawStrain * p.strainRecoveryMult;
  c.strain = Math.max(0, Math.min(100, Math.round((c.strain || 0) + scaled)));
}

export function startLifeFromDraft(custom = {}) {
  const d = { ...(state.draft || rollDraftCharacter()), ...custom };
  const bg = getBackground(d.backgroundId);

  const stats = {
    health: 64 + Math.floor(Math.random() * 15),
    happiness: 58 + Math.floor(Math.random() * 15),
    smarts: 38 + Math.floor(Math.random() * 23),
    looks: 38 + Math.floor(Math.random() * 25),
  };

  for (const [k, v] of Object.entries(bg.mods || {})) {
    if (k in stats) stats[k] += v;
  }
  for (const tid of d.traits || []) {
    const tr = getTrait(tid);
    if (!tr) continue;
    for (const [k, v] of Object.entries(tr.mods || {})) {
      if (k in stats) stats[k] += v;
    }
  }
  for (const k of Object.keys(stats)) stats[k] = clampStat(stats[k]);

  const inheritedCash = Number(d.inheritedMoney || 0);
  const startingMoney = bg.startingMoney + inheritedCash;

  state.character = {
    firstName: (d.firstName || 'Alex').trim(),
    lastName: (d.lastName || 'Mercer').trim(),
    birthYear: Number(d.birthYear) || 1995,
    age: 0,
    year: Number(d.birthYear) || 1995,
    stage: 'Baby',
    alive: true,
    causeOfDeath: null,
    stats,
    appearance: d.appearance || {},
    threads: [],
    money: startingMoney,
    peakMoney: startingMoney,
    backgroundId: bg.id,
    traits: d.traits || [],
    flags: d.inheritedHome ? { homeowner: true } : {},
    children: [],
    // Energy & Strain fields
    strain: 0,
    nextEnergyBonus: 0,
    energyMax: 2,
    energy: 2,
    energyBreakdown: { total: 2, ageBase: 2, healthMod: 0, strainMod: 0, recoveryMod: 0, traitMod: 0 },
    yearActions: [],
    lastRoutine: [],
    lastRoutineStage: 'Baby',
    progress: {
      career: 0,
      promotions: 0,
      school: 0,
      social: 0,
      hustle: 0,
    },
  };

  initLife(state.character);
  if (d.inheritedAssets) Object.assign(state.character.life, d.inheritedAssets);
  const pool = computeYearEnergyPool(state.character);
  state.character.energyMax = pool.total;
  state.character.energy = pool.total;
  state.character.energyBreakdown = pool;

  if (!state.dynasty.familyName) {
    state.dynasty.familyName = state.character.lastName;
  }

  state.mode = 'live';
  state.pendingEvents = [];
  state.seenOnce = {};
  state.recentEvents = [];
  state.log = [
    {
      age: 0,
      year: state.character.year,
      stage: 'Baby',
      tone: 'milestone',
      text: `Born into the ${state.character.lastName} family (${bg.name}).${inheritedCash > 0 ? ` Inherited $${inheritedCash.toLocaleString()} from the family estate.` : ''}`,
    },
  ];
  state.draft = null;
  saveGame();
}

export function addLog(text, tone = 'neutral') {
  const c = state.character;
  if (!c) return;
  state.log.unshift({
    age: c.age,
    year: c.year,
    stage: c.stage,
    tone,
    text,
  });
}

// Compute passive yearly net income/upkeep (including promotions & hustle mastery!)
export function yearlyCashDelta(c) {
  return finance(c, traitPassives(c)).net;
}

// Spend Energy on a single action during Beat 2
export function canPerformAction(c, action) {
  if (!c || !c.alive || !action) return { ok: false, reason: 'Unavailable' };
  if (state.pendingEvents.length > 0) return { ok: false, reason: 'Resolve event first' };
  if (action.id === "work_overtime" && !initLife(c).job) return {ok:false,reason:"Requires job"};
  if (!action.stages.includes(c.stage)) return { ok: false, reason: 'Wrong life stage' };
  if (c.energy < action.cost) return { ok: false, reason: `Needs ${action.cost}⚡` };
  if (action.minMoney && c.money < action.minMoney) return { ok: false, reason: `Needs $${action.minMoney}` };
  if (action.maxPerYear) {
    const count = (c.yearActions || []).filter(id => id === action.id).length;
    if (count >= action.maxPerYear) return { ok: false, reason: `Max ${action.maxPerYear}/yr` };
  }
  return { ok: true };
}

export function performEnergyAction(actionId) {
  const c = state.character;
  const action = getActionById(actionId);
  const check = canPerformAction(c, action);
  if (!check.ok) return null;

  c.energy -= action.cost;
  c.yearActions = c.yearActions || [];
  c.yearActions.push(action.id);

  const deltas = {};
  for (const [k, v] of Object.entries(action.effects || {})) {
    if (k === 'money') {
      c.money += v;
      deltas.money = (deltas.money || 0) + v;
      if (c.money > c.peakMoney) c.peakMoney = c.money;
    } else if (k in c.stats) {
      const actual = applyStatDelta(c, k, v);
      if (actual !== 0) deltas[k] = (deltas[k] || 0) + actual;
    }
  }

  const l=initLife(c);
  if(action.progress?.school && c.age<18) l.education.grade=clampStat(l.education.grade+5*action.progress.school);
  if(l.job && action.progress?.career) l.job.performance=clampStat(l.job.performance+12*action.progress.career);
  if (action.strain) applyStrainDelta(c, action.strain);
  if (action.nextEnergyBonus) {
    c.nextEnergyBonus = Math.min(2, (c.nextEnergyBonus || 0) + action.nextEnergyBonus);
  }

  if (action.progress) {
    c.progress = c.progress || { career: 0, promotions: 0, school: 0, social: 0, hustle: 0 };
    for (const [pk, pv] of Object.entries(action.progress)) {
      c.progress[pk] = (c.progress[pk] || 0) + pv;
    }
  }

  if (c.stats.health <= 0) {
    finalizeDeath('Collapsed from severe exhaustion and failing health');
  }

  saveGame();
  return { deltas, action };
}

// Execute a sequence of action IDs (for "Repeat Last Year" or a saved/preset Routine)
export function runActionRoutine(seq = []) {
  const c = state.character;
  if (!c || !c.alive || c.encounter || state.pendingEvents.length > 0) return null;

  const combinedDeltas = {};
  let executed = 0;

  for (const actId of seq) {
    const res = performEnergyAction(actId);
    if (!res) continue;
    executed += 1;
    for (const [k, v] of Object.entries(res.deltas || {})) {
      combinedDeltas[k] = (combinedDeltas[k] || 0) + v;
    }
    if (!c.alive || c.energy <= 0) break;
  }

  saveGame();
  return { executed, deltas: combinedDeltas };
}

export function saveCurrentAsRoutine(name) {
  const c = state.character;
  if (!c || !c.yearActions?.length) return false;
  const cleanName = (name || '').trim().slice(0, 28) || `${c.stage} Routine`;
  state.customRoutines = state.customRoutines || [];
  state.customRoutines.push({
    id: 'rt_' + Date.now().toString(36),
    name: cleanName,
    stage: c.stage,
    seq: [...c.yearActions],
  });
  saveGame();
  return true;
}

export function deleteCustomRoutine(id) {
  state.customRoutines = (state.customRoutines || []).filter(r => r.id !== id);
  saveGame();
}

// ============================================================
// BEAT 3 -> BEAT 1 TRANSITION: Finish Current Year & Advance Age
// ============================================================
export function finishYearAndAgeUp() {
  const c = state.character;
  if (!c || !c.alive || c.encounter || state.pendingEvents.length > 0) return null;

  const deltas = {};
  const summaryParts = [];
  const chosenActions = [...(c.yearActions || [])];

  // Save routine memory if the player actively picked actions this year
  if (chosenActions.length > 0) {
    c.lastRoutine = [...chosenActions];
    c.lastRoutineStage = c.stage;
  }

  // 1. Unspent Energy Rule: leftover energy automatically converts into Rest!
  const unspent = c.energy || 0;
  if (unspent > 0) {
    // Each unspent point relieves Strain (-6) and every 2 points gently lifts Happiness/Health
    applyStrainDelta(c, -6 * unspent);
    const happyGain = Math.floor((unspent + 1) / 2);
    if (happyGain > 0) {
      const actualH = applyStatDelta(c, 'happiness', Math.min(4, happyGain));
      if (actualH) deltas.happiness = (deltas.happiness || 0) + actualH;
    }
    if (unspent >= 4) {
      const actualHp = applyStatDelta(c, 'health', 1);
      if (actualHp) deltas.health = (deltas.health || 0) + actualHp;
      // Taking a genuinely light year grants +1 recovery energy next year!
      c.nextEnergyBonus = Math.min(2, (c.nextEnergyBonus || 0) + 1);
    }
    c.energy = 0;
  } else {
    // Natural overnight recovery baseline (-4 strain) when spending every single drop
    applyStrainDelta(c, -4);
  }

  // 2. Summarize Beat 2 actions & resolve end-of-year milestones (promotions, honors, burnout!)
  if (chosenActions.length > 0) {
    const counts = {};
    for (const id of chosenActions) counts[id] = (counts[id] || 0) + 1;
    const labels = Object.entries(counts).map(([id, n]) => {
      const a = getActionById(id);
      return a ? (n > 1 ? `${a.name} ×${n}` : a.name) : id;
    });
    summaryParts.push(`Spent the year on ${labels.join(', ')}${unspent > 0 ? ` (+${unspent}⚡ auto-rested)` : ''}.`);
  } else if (unspent > 0) {
    summaryParts.push(`Took an unhurried, restful year (${unspent}⚡ auto-rested).`);
  }

  // Check Career Promotion threshold (every 3 career progress points -> promotion!)
  c.progress = c.progress || { career: 0, promotions: 0, school: 0, social: 0, hustle: 0 };
  // Check School Honors milestone in Child/Teen years
  if ((c.stage === 'Child' || c.stage === 'Teen') && c.progress.school >= 5 && !c.flags.honor_scholar) {
    c.flags.honor_scholar = true;
    applyStatDelta(c, 'smarts', 4);
    summaryParts.push(`🎖️ Named Top Honor Scholar after years of dedicated study!`);
  }

  // Check Social Circle milestone (strong social bonds cushion Happiness & spark romance)
  if (c.progress.social >= 4 && !c.flags.strong_circle) {
    c.flags.strong_circle = true;
    applyStatDelta(c, 'happiness', 4);
    summaryParts.push(`🤝 Built a Ride-or-Die Circle of close friends.`);
  }

  // Check Burnout Crash if Strain pushed past 88 at year-end!
  let burnedOut = false;
  if ((c.strain || 0) >= 88) {
    burnedOut = true;
    const hpHit = applyStatDelta(c, 'health', -10);
    const hapHit = applyStatDelta(c, 'happiness', -8);
    if (hpHit) deltas.health = (deltas.health || 0) + hpHit;
    if (hapHit) deltas.happiness = (deltas.happiness || 0) + hapHit;
    // Crash forces rest, dropping strain somewhat, though next year's pool will still sting
    c.strain = 68;
    summaryParts.push(`⚠️ Burnout crash! Pushing non-stop took a heavy toll on your health and spirits.`);
  }

  const beforeCash=c.money;
  annualLife(c,summaryParts,applyStatDelta,traitPassives(c));
  deltas.money=(deltas.money||0)+c.money-beforeCash;
  c.peakMoney=Math.max(c.peakMoney,c.money);
  // Write Beat 3 End-of-Year Summary to the Life Log (for the year just completed)
  if (summaryParts.length > 0) {
    const tone = burnedOut ? 'bad' : summaryParts.some(s => s.includes('🏆') || s.includes('🎖️')) ? 'milestone' : 'neutral';
    addLog(summaryParts.join(' '), tone);
  }

  if (c.stats.health <= 0) {
    finalizeDeath('Collapsed from chronic burnout and failing health');
    saveGame();
    return { died: true, deltas };
  }

  // ==========================================================
  // ADVANCE TO NEXT YEAR — BEAT 1 (Start of New Year)
  // ==========================================================
  c.age += 1;
  c.year += 1;
  c.stage = stageForAge(c.age);
  c.yearActions = [];

  // Natural yearly stat drift
  applyYearlyDrift(c, deltas);

  // Check mortality
  if (checkDeath(c)) {
    saveGame();
    return { died: true, deltas };
  }

  // Compute this new year's Energy Pool (consumes nextEnergyBonus)
  const pool = computeYearEnergyPool(c);
  c.energyMax = pool.total;
  c.energy = pool.total;
  c.energyBreakdown = pool;
  c.nextEnergyBonus = 0;

  // Draw 1–2 Start-of-Year Event Cards
  const drawn = drawEventsForYear(c);
  if (drawn.length > 0) {
    state.pendingEvents.push(...drawn);
  }

  saveGame();
  return { died: false, deltas };
}

// Keep `ageUp` export aliased for compatibility
export const ageUp = finishYearAndAgeUp;

function applyYearlyDrift(c, deltas) {
  const p = traitPassives(c);

  const baseline = clampStat(
    64 + p.happyBaseline
      + (c.flags.has_partner ? 4 : 0)
      + (c.flags.strong_circle ? 3 : 0)
      + (c.flags.homeowner ? 3 : 0)
      + (c.money < 0 ? -8 : 0)
  );
  const happyGap = c.stats.happiness - baseline;
  if (Math.abs(happyGap) >= 6) {
    const pull = happyGap > 0 ? -Math.ceil(happyGap * 0.14) : Math.ceil(Math.abs(happyGap) * 0.12);
    c.stats.happiness = clampStat(c.stats.happiness + pull);
  }

  if (c.age >= 15 && c.age <= 23 && Math.random() < 0.30 && c.stats.looks < 82) {
    c.stats.looks = clampStat(c.stats.looks + 1);
  } else if (c.age >= 32) {
    const fadeChance = (c.age >= 55 ? 0.68 : 0.45) * p.looksDecayMult;
    if (Math.random() < fadeChance) {
      const loss = c.age >= 68 && Math.random() < 0.35 ? 2 : 1;
      c.stats.looks = clampStat(c.stats.looks - loss);
    }
  }

  const floor = Math.max(58, p.smartsFloor);
  if (c.age >= 26 && c.stats.smarts > floor && Math.random() < 0.30) {
    c.stats.smarts = clampStat(c.stats.smarts - 1);
  }

  // Exceptional scores require maintenance, even before middle age.
  for (const key of ['smarts', 'looks']) {
    const current = c.stats[key];
    if (c.age >= 13 && current > 80) {
      const loss = Math.ceil((current - 80) * (key === 'looks' ? 0.18 : 0.15));
      const next = clampStat(current - loss);
      c.stats[key] = next;
      deltas[key] = (deltas[key] || 0) + next - current;
    }
  }

  if (c.age >= 65) {
    const rawWear = 1 + Math.floor((c.age - 62) / 9) + (Math.random() < 0.45 ? 2 : 0);
    const wear = Math.max(1, Math.round(rawWear * p.healthLossMult));
    c.stats.health = clampStat(c.stats.health - wear);
    deltas.health = (deltas.health || 0) - wear;
  } else if (c.age >= 38 && Math.random() < 0.42 * p.healthLossMult) {
    c.stats.health = clampStat(c.stats.health - 1);
  }
}

function checkDeath(c) {
  if (c.stats.health <= 0) {
    finalizeDeath('Complications from failing health');
    return true;
  }
  if (c.age >= 72) {
    const ageFactor = Math.pow(Math.max(0, c.age - 70) / 34, 2.4) * 0.42;
    const healthPenalty = c.stats.health < 35 ? (35 - c.stats.health) * 0.008 : 0;
    if (Math.random() < ageFactor + healthPenalty) {
      finalizeDeath('Passed away peacefully in their sleep of old age');
      return true;
    }
  }
  return false;
}

export function finalizeDeath(cause) {
  const c = state.character;
  if (!c) return;
  c.alive = false;
  c.causeOfDeath = cause;
  state.pendingEvents = [];
  state.mode = 'dead';
  addLog(`Died at age ${c.age} (${c.year}): ${cause}.`, 'bad');

  state.dynasty.ancestors.push({
    generation: state.dynasty.generation,
    name: `${c.firstName} ${c.lastName}`,
    birthYear: c.birthYear,
    deathYear: c.year,
    age: c.age,
    money: c.money,
    cause,
    childrenCount: c.children?.length || 0,
    traits: [...(c.traits || [])],
    storyHistory: c.journal?.history || [],
  });

  if (c.flags.wrote_memoirs) state.dynasty.legacyFlags.memoirs = true;
}

function filterEligibleEvents(c, ignoreRecent = false) {
  const gen = state.dynasty.generation || 1;
  return LIFE_EVENTS.filter(ev => {
    if (ev.bgId && ev.bgId !== c.backgroundId) return false;
    if (ev.stages && !ev.stages.includes(c.stage)) return false;
    if (ev.minAge !== undefined && c.age < ev.minAge) return false;
    if (ev.maxAge !== undefined && c.age > ev.maxAge) return false;
    if (ev.once && state.seenOnce[ev.id]) return false;
    if (ev.reqFlag && !c.flags[ev.reqFlag]) return false;
    if (ev.notFlag && c.flags[ev.notFlag]) return false;
    if (ev.reqGeneration && gen < ev.reqGeneration) return false;
    if (!ignoreRecent && state.recentEvents.includes(ev.id)) return false;
    return true;
  });
}

function drawEventsForYear(c) {
  let eligible = filterEligibleEvents(c, false);
  if (eligible.length === 0) {
    eligible = filterEligibleEvents(c, true);
  }
  if (eligible.length === 0) return [];

  const milestone = eligible.find(e => e.id === 'adult_crossroads_18');
  if (!milestone && Math.random() < 0.08) {
    return [];
  }

  const bgEvents = eligible.filter(e => e.bgId === c.backgroundId);
  let first;
  if (milestone) {
    first = milestone;
  } else if (bgEvents.length > 0 && Math.random() < 0.65) {
    first = pickRandom(bgEvents);
  } else {
    first = pickRandom(eligible);
  }

  const picked = [first];

  // 22% chance a second event lands at the start of the year
  if ((c.stage === 'Teen' || c.stage === 'Adult') && Math.random() < 0.22) {
    const rest = eligible.filter(e => e.id !== first.id);
    if (rest.length > 0) picked.push(pickRandom(rest));
  }

  for (const ev of picked) {
    if (ev.once) state.seenOnce[ev.id] = true;
    state.recentEvents.push(ev.id);
    if (state.recentEvents.length > 6) state.recentEvents.shift();
  }

  return picked.map(ev => ev.id);
}

export function getActiveEvent() {
  if (!state.pendingEvents.length) return null;
  return LIFE_EVENTS.find(e => e.id === state.pendingEvents[0]) || null;
}

export function resolveChoice(choiceIdx) {
  const c = state.character;
  const ev = getActiveEvent();
  if (!c || !ev) return null;

  const choice = ev.choices[choiceIdx];
  if (!choice) return null;

  state.pendingEvents.shift();
  const p = traitPassives(c);

  // Studying in Beat 2 boosts exam/academic event odds!
  const schoolBoost = (ev.id.includes('exam') || ev.id.includes('spelling')) && (c.progress?.school || 0) >= 2 ? 0.12 : 0;

  let outcome = choice;
  if (choice.risk) {
    const effectiveChance = Math.max(0.05, Math.min(0.95, choice.risk.chance + p.riskBonus + schoolBoost));
    const passed = Math.random() < effectiveChance;
    outcome = passed ? choice.risk.pass : choice.risk.fail;
  }

  const deltas = {};
  const effects = outcome.effects || {};
  for (const [k, v] of Object.entries(effects)) {
    if (k === 'money') {
      c.money += v;
      deltas.money = (deltas.money || 0) + v;
      if (c.money > c.peakMoney) c.peakMoney = c.money;
    } else if (k in c.stats) {
      const actual = applyStatDelta(c, k, v);
      if (actual !== 0) deltas[k] = (deltas[k] || 0) + actual;
    }
  }

  if (choice.setFlag) c.flags[choice.setFlag] = true;
  if (outcome.setFlag) c.flags[outcome.setFlag] = true;

  if (choice.addChild || outcome.addChild) {
    const childName = pickRandom(FIRST_NAMES);
    c.children.push({
      firstName: childName,
      lastName: c.lastName,
      birthYear: c.year,
    });
    addLog(`${childName} ${c.lastName} was born!`, 'milestone');
  }

  initLife(c); syncChildren(c);
  const netTone = (deltas.happiness || 0) + (deltas.health || 0) + ((deltas.money || 0) > 0 ? 4 : (deltas.money || 0) < -200 ? -4 : 0);
  const tone = netTone >= 4 ? 'good' : netTone <= -4 ? 'bad' : 'neutral';
  if (outcome.log) addLog(outcome.log, tone);

  if (c.stats.health <= 0) {
    finalizeDeath('Succumbed to critical injuries / poor health');
  }

  saveGame();
  return { deltas };
}

export function continueAsHeir(childIdx = 0) {
  const prev = state.character;
  if (!prev || !prev.children?.length) return false;
  const child = prev.children[childIdx] || prev.children[0];

  const estateRate = prev.flags.estate_trust ? 0.9 : 0.7;
  const inheritedMoney = prev.money > 0 ? Math.floor(prev.money * estateRate) : 0;

  state.dynasty.generation += 1;
  const rolled = rollDraftCharacter({
    firstName: child.firstName,
    lastName: child.lastName,
    birthYear: child.birthYear,
  });

  startLifeFromDraft({
    ...rolled,
    backgroundId: prev.backgroundId,
    inheritedMoney,
    inheritedHome: Boolean(prev.flags.homeowner),
    inheritedAssets: {home:prev.life.home,mortgage:prev.life.mortgage,investment:prev.life.investment,car:prev.life.car,ambition: {...prev.life.ambition,skills:{},followers:0,views:0,posts:0,viral:0,creatorIncome:0}},
  });
  return true;
}

export function beginNewDynasty() {
  state.dynasty = {
    generation: 1,
    familyName: '',
    ancestors: [],
    legacyFlags: {},
  };
  state.mode = 'create';
  state.character = null;
  state.pendingEvents = [];
  state.draft = rollDraftCharacter();
  saveGame();
}

export { getActionsForCharacter };

export function performLifeOption(id){const c=state.character;if(!c?.alive||state.pendingEvents.length)return false;const a=lifeOptions(c).find(x=>x.id===id);if(!a?.ok)return false;c.energy-=a.cost;c.money-=a.cash;a.run();refreshAchievements(c);const recovery=/^(time:|talk:|gift:|prison:4|clinic:)/.test(id);const intense=/^(crime:|path-act:.*:3|media:4)/.test(id);applyStrainDelta(c,recovery?-a.cost*2:intense?a.cost*4:a.cost*2);c.peakMoney=Math.max(c.peakMoney,c.money);c.yearActions.push(a.label);saveGame();return true;}
