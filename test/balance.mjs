// Balance simulations. Run with `npm run balance` after touching any
// tuning number: classes, town revenue, or the material markup.
import { BUILDINGS, MAX_BUILDING_LEVEL } from '../src/data/town.js';
import { getItem } from '../src/data/items.js';
import { CLASSES, SIGNATURE } from '../src/data/classes.js';

const markupFor = (def, level) => (def.markup ?? 1.0) * (1 + (level - 1) * 0.30);

// A representative staff member: average trait, mid skill
const wageFor = skill => Math.floor(10 + skill * 12);

// cheap vs rich material for each input category
const SAMPLE = {
  any_resource: { cheap: 'oak_log', rich: 'runite_bar' },
  any_food:     { cheap: 'shrimp',  rich: 'leviathan_steak' },
  any_herb:     { cheap: 'herb_sagewort', rich: 'herb_kingsleaf' },
  any_bar:      { cheap: 'bronze_bar', rich: 'runite_bar' },
};

console.log('Profit per minute at each level, fully staffed, mid-skill workers');
console.log('(cheap = worst material you could stock, rich = best)\n');
for (const def of Object.values(BUILDINGS)) {
  const rows = [];
  for (let lvl = 1; lvl <= MAX_BUILDING_LEVEL; lvl++) {
    const staff = def.staffSlots;
    const skill = Math.min(10, 2 + lvl);              // staff you'd plausibly have
    const wage = wageFor(skill) * staff;
    const skillMult = 1 + (skill * staff) * 0.08;
    const levelMult = 1 + (lvl - 1) * 0.6;
    const labour = ((def.revenue[0] + def.revenue[1]) / 2) * levelMult;
    const cyclesPerMin = 60000 / def.cycleMs;
    const out = {};
    for (const kind of ['cheap', 'rich']) {
      let goods = 0;
      for (const [cat, qty] of Object.entries(def.inputs || {})) {
        const need = Math.max(1, Math.ceil(qty * lvl));
        goods += need * (getItem(SAMPLE[cat][kind])?.sell || 0);
      }
      const rev = (labour + goods * markupFor(def, lvl)) * skillMult;
      out[kind] = (rev - wage) * cyclesPerMin;
      out[kind + 'Goods'] = goods;
    }
    rows.push({ lvl, wage: wage * cyclesPerMin, ...out });
  }
  console.log(`${def.icon} ${def.name}  (${def.cycleMs/1000}s cycle, ${def.staffSlots} staff, markup x${def.markup ?? '-'})`);
  for (const r of rows) {
    const f = n => (n >= 0 ? '+' : '') + Math.round(n).toLocaleString();
    console.log(`   Lv${r.lvl}  wages ${Math.round(r.wage).toLocaleString().padStart(6)}/min` +
      `   cheap ${f(r.cheap).padStart(10)}/min (goods ${r.cheapGoods}g)` +
      `   rich ${f(r.rich).padStart(12)}/min (goods ${r.richGoods.toLocaleString()}g)`);
  }
  console.log();
}


console.log('\n\n=== CLASSES ===\n');

import { CLASSES as CLS, SIGNATURE as SIG } from '../src/data/classes.js';
import { TREES } from '../src/data/talents.js';

const BAL = { ACCURACY_BASE:22, ACCURACY_PER_ATTACK_LEVEL:2, ACCURACY_DEFENSE_CONSTANT:10,
  MAXHIT_BASE:4, MAXHIT_PER_STRENGTH_LEVEL:0.8, MAXHIT_PER_GEAR_STR:0.65,
  MINHIT_FRACTION_BASE:0.30, MINHIT_FRACTION_PER_ATTACK_LEVEL:0.001, MINHIT_FRACTION_CAP:0.42,
  ATTACK_INTERVAL_MS:2400, DR_SOFTCAP_CONSTANT:220, DR_FLAT_CAP:0.60, DR_MULT_CAP:0.45, DR_TOTAL_CAP:0.85 };

const CH = { atk:55, str:55, def:50, hp:55, gearAtk:60, gearStr:45, gearHp:80, gearDef:70,
             STR:15, AGI:15, VIT:15, INT:15, LUK:10 };

/**
 * `overLevel` is how far above the player's combat level the target is.
 * The Priest is the only class paid for that, so comparing classes at 0
 * would hide its whole identity and comparing at 20 would flatter it.
 * Both are reported.
 */
function profile(cls, { talentPoints = 0, overLevel = 0 } = {}) {
  // Spend points greedily down the tree, in listed order, respecting max ranks.
  const spend = {};
  if (cls && talentPoints > 0) {
    let left = talentPoints;
    for (const node of TREES[cls.id] || []) {
      for (let r = 0; r < node.max && left >= node.cost; r++) { left -= node.cost; spend[node.id] = (spend[node.id]||0)+1; }
    }
  }
  const tb = key => {
    let t = 0;
    for (const node of TREES[cls?.id] || []) {
      const r = spend[node.id] || 0;
      if (r && node.bonus?.[key]) t += node.bonus[key] * r;
    }
    return t;
  };
  const b = k => cls ? ((cls.passive[k]||0) + tb(k)) : 0;

  const over = Math.min(SIG.OVERLEVEL_CAP, overLevel);
  const overDmg = Math.min(SIG.OVERLEVEL_MAX_DAMAGE, 1 + b('overlevel_damage') * over);
  const overLoot = Math.min(SIG.OVERLEVEL_MAX_LOOT, 1 + b('overlevel_loot') * over);

  const monDef = 55 + overLevel * 2.2;
  const monHp  = 900 + overLevel * 90;
  const monAtk = 46 + overLevel * 3.4;

  const acc = (BAL.ACCURACY_BASE + CH.atk*BAL.ACCURACY_PER_ATTACK_LEVEL + CH.gearAtk) * (1 + b('accuracy'));
  const hitChance = Math.min(1, acc / (acc + monDef + BAL.ACCURACY_DEFENSE_CONSTANT));
  const maxHit = Math.max(1, Math.floor(
    (BAL.MAXHIT_BASE + CH.str*BAL.MAXHIT_PER_STRENGTH_LEVEL + CH.gearStr*BAL.MAXHIT_PER_GEAR_STR)
    * (1 + CH.STR*0.01) * (1 + b('damage')) * (1 + CH.INT*b('int_damage'))));
  const minFrac = Math.min(BAL.MINHIT_FRACTION_CAP, BAL.MINHIT_FRACTION_BASE + CH.atk*BAL.MINHIT_FRACTION_PER_ATTACK_LEVEL);
  const avgHit = (Math.max(1, Math.floor(maxHit*minFrac)) + maxHit)/2 * overDmg;
  const crit = b('crit');
  const critMult = SIG.CRIT_MULTIPLIER * (1 + b('crit_damage'));
  const critted = avgHit * (1 + crit*(critMult-1));
  const burn = critted * (cls?.id==='mage' ? SIG.BURN_FRACTION*(1+b('burn')) : 0);
  const interval = BAL.ATTACK_INTERVAL_MS / (1 + CH.AGI*0.005 + b('attack_speed'));
  // The Beastmaster's companion swings with you for a share of the blow.
  // Modelled at full strength: the class's own penalty line already says
  // it is worth nothing without a pet, and the interesting question is
  // whether it is competitive WITH one.
  const pet = 1 + b('pet_damage');
  const dps = (critted + burn) * pet * hitChance / (interval/1000);

  const maxHp = Math.floor((10*CH.hp + CH.gearHp) * (1 + CH.VIT*0.01) * (1 + b('maxhp')));
  const drRating = CH.def*2 + CH.gearDef;
  const flat = Math.min(BAL.DR_FLAT_CAP, drRating/(drRating+BAL.DR_SOFTCAP_CONSTANT));
  const dr = Math.max(0, Math.min(BAL.DR_TOTAL_CAP, flat * (1 + b('dr'))));
  // The Warden reflects a share of every blow, which is both damage it
  // does not take and damage the monster does. Both halves matter and
  // leaving them out made the class look like it had no kit at all.
  const thorns = b('thorns');
  const incoming = monAtk*(1-dr)/2.6;
  const thornDps = incoming * thorns;
  const dpsTotal = dps + thornDps;

  const killSecs = monHp / dpsTotal;
  const mend = cls?.id==='priest' ? maxHp*(SIG.MEND_FRACTION + b('mend')) : 0;
  const net = incoming*killSecs - mend;
  const ehp = net > 0 ? maxHp/net : Infinity;

  return { dps: dpsTotal, killSecs, ehp, maxHp, thornDps,
    // The two classes whose power sits outside the combat model at all.
    petAmp: 1 + b('pet_amp'), adventure: (1 + b('adventure_speed')) * (1 + b('adventure_reward')),
    gold:(1+b('gold'))*overLoot, xp:1+b('xp'), drop:(1+b('drop_rate'))*overLoot,
    gather:1+b('gather_speed'), town:1+b('town_revenue'), sell:1+b('sell_price') };
}

function table(label, opts) {
  const base = profile(null, opts);
  const rows = [['(no class)', base], ...Object.values(CLS).map(c => [c.name, profile(c, opts)])];
  console.log(label);
  console.log('  class        DPS        kill    survives      combat idx   economy idx');
  for (const [n,p] of rows) {
    // Survivability past a few kills-worth is nearly worthless in an idle
    // game: auto-eat already stops you dying, so "unkillable" and "very
    // hard to kill" play identically. Capping the factor at 4 stops the
    // index from crowning whatever stacks the most health.
    const surv = x => Math.min(4, x === Infinity ? 4 : x);
    const combat = (p.dps * surv(p.ehp)) / (base.dps * surv(base.ehp));
    const econ = (p.gold*p.drop*p.gather*p.town*p.sell) / (base.gold*base.drop*base.gather*base.town*base.sell);
    console.log('  ' + n.padEnd(12) +
      p.dps.toFixed(1).padStart(6) + '   ' + (p.killSecs.toFixed(0)+'s').padStart(6) + '   ' +
      (p.ehp===Infinity?'forever':p.ehp.toFixed(1)+' kills').padStart(11) + '   ' +
      (combat.toFixed(2)+'x').padStart(10) + '   ' + (econ.toFixed(2)+'x').padStart(11));
  }
  console.log('');
}

table('AT YOUR LEVEL, no talents (the fair fight)', { talentPoints: 0, overLevel: 0 });
table('10 LEVELS ABOVE YOU, no talents (the unfair fight)', { talentPoints: 0, overLevel: 10 });
table('AT YOUR LEVEL, 20 talent points invested', { talentPoints: 20, overLevel: 0 });
table('10 LEVELS ABOVE YOU, 50 talent points (a maxed class)', { talentPoints: 50, overLevel: 10 });

// ------------------------------------------------------------
// Two classes keep their power somewhere the combat and economy indices
// cannot see it, and reporting them at 0.9x without saying so would be a
// lie by omission — it reads as "these are weak" when it means "this
// model does not measure what they do".
console.log('POWER THE INDICES ABOVE CANNOT SEE\n');
console.log('  class          companion  adventure   what the index is missing');
for (const c of Object.values(CLS)) {
  const p = profile(c, { talentPoints: 50, overLevel: 0 });
  if (p.petAmp <= 1.001 && p.adventure <= 1.001) continue;
  const note = p.petAmp > 1.001 && p.adventure > 1.001 ? 'both'
    : p.petAmp > 1.001
      ? 'every pet bonus in the game, multiplied'
      : 'the whole Adventure loop: sooner, richer, kinder';
  console.log('  ' + c.name.padEnd(14) +
    (p.petAmp.toFixed(2) + 'x').padStart(9) + '  ' +
    (p.adventure.toFixed(2) + 'x').padStart(9) + '   ' + note);
}
console.log('\n  A maxed Beastmaster with an Elder legendary is multiplying a bonus');
console.log('  that is already the largest single number a pet can produce.');
console.log('  A maxed Wanderer sees roughly twice as many encounters, each worth');
console.log('  roughly twice as much. Neither shows up as DPS and neither should.\n');
