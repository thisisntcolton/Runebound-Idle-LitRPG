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

const BAL = { ACCURACY_BASE:22, ACCURACY_PER_ATTACK_LEVEL:2, ACCURACY_DEFENSE_CONSTANT:10,
  MAXHIT_BASE:4, MAXHIT_PER_STRENGTH_LEVEL:0.8, MAXHIT_PER_GEAR_STR:0.65,
  MINHIT_FRACTION_BASE:0.30, MINHIT_FRACTION_PER_ATTACK_LEVEL:0.001, MINHIT_FRACTION_CAP:0.42,
  ATTACK_INTERVAL_MS:2400, DR_SOFTCAP_CONSTANT:220, DR_FLAT_CAP:0.60, DR_MULT_CAP:0.45, DR_TOTAL_CAP:0.85 };

// A mid-game character: level 50s, decent gear, some stat points
const CH = { atk:55, str:55, def:50, hp:55, gearAtk:60, gearStr:45, gearHp:80, gearDef:70,
             STR:15, AGI:15, VIT:15, INT:15, LUK:10 };
const MON = { hp: 900, defense: 55, attack: 46, attackSpeed: 2600, name: 'mid-game elite' };

const b = (cls,k) => cls ? (cls.passive[k]||0) : 0;

function profile(cls) {
  const acc = (BAL.ACCURACY_BASE + CH.atk*BAL.ACCURACY_PER_ATTACK_LEVEL + CH.gearAtk) * (1 + b(cls,'accuracy'));
  const hitChance = acc / (acc + MON.defense + BAL.ACCURACY_DEFENSE_CONSTANT);
  const maxHit = Math.max(1, Math.floor(
    (BAL.MAXHIT_BASE + CH.str*BAL.MAXHIT_PER_STRENGTH_LEVEL + CH.gearStr*BAL.MAXHIT_PER_GEAR_STR)
    * (1 + CH.STR*0.01) * (1 + b(cls,'damage')) * (1 + CH.INT*b(cls,'int_damage'))));
  const minFrac = Math.min(BAL.MINHIT_FRACTION_CAP, BAL.MINHIT_FRACTION_BASE + CH.atk*BAL.MINHIT_FRACTION_PER_ATTACK_LEVEL);
  const minHit = Math.max(1, Math.floor(maxHit*minFrac));
  const avgHit = (minHit + maxHit)/2;
  const crit = b(cls,'crit');
  const critted = avgHit * (1 + crit*(SIGNATURE.CRIT_MULTIPLIER-1));
  const burn = critted * (cls?.id==='mage' ? SIGNATURE.BURN_FRACTION : 0);
  const interval = BAL.ATTACK_INTERVAL_MS / (1 + CH.AGI*0.005 + b(cls,'attack_speed'));
  const dps = (critted + burn) * hitChance / (interval/1000);

  const maxHp = Math.floor((10*CH.hp + CH.gearHp) * (1 + CH.VIT*0.01) * (1 + b(cls,'maxhp')));
  const drRating = CH.def*2 + CH.gearDef;
  const flat = Math.min(BAL.DR_FLAT_CAP, drRating/(drRating+BAL.DR_SOFTCAP_CONSTANT));
  const dr = Math.max(0, Math.min(BAL.DR_TOTAL_CAP, flat * (1 + b(cls,'dr'))));
  const incoming = MON.attack * (1-dr) / (MON.attackSpeed/1000);
  const killSecs = MON.hp / dps;
  const mend = cls?.id==='priest' ? maxHp*SIGNATURE.MEND_FRACTION : 0;
  const netIncomingPerKill = incoming*killSecs - mend;
  const effHp = netIncomingPerKill > 0 ? maxHp / netIncomingPerKill : Infinity;

  return { dps, killSecs, maxHp, dr, ehp: effHp,
    gold: 1 + b(cls,'gold'), xp: 1 + b(cls,'xp'), drop: 1 + b(cls,'drop_rate'),
    gather: 1 + b(cls,'gather_speed'), town: 1 + b(cls,'town_revenue'), sell: 1 + b(cls,'sell_price') };
}

const base = profile(null);
const rows = [['(no class)', base], ...Object.values(CLASSES).map(c => [c.name, profile(c)])];

const pct = (v, ref) => { const d = (v/ref-1)*100; return (d>=0?'+':'')+d.toFixed(0)+'%'; };
console.log('Relative to no class, mid-game character vs a 900hp/55def elite\n');
console.log('class        DPS      kill    survives   gold    xp    drop  gather  town');
for (const [name, p] of rows) {
  console.log(
    name.padEnd(12) +
    (p.dps.toFixed(1)+' '+pct(p.dps, base.dps)).padEnd(16) +
    (p.killSecs.toFixed(0)+'s').padEnd(8) +
    (p.ehp===Infinity ? 'forever' : p.ehp.toFixed(1)+' kills').padEnd(11) +
    pct(p.gold,1).padEnd(8) + pct(p.xp,1).padEnd(6) +
    pct(p.drop,1).padEnd(6) + pct(p.gather,1).padEnd(8) + pct(p.town,1));
}

console.log('\nCombat power index (DPS x survivability, normalised):');
const idx = rows.map(([n,p]) => [n, p.dps * Math.min(20, p.ehp===Infinity?20:p.ehp)]);
const refIdx = idx[0][1];
for (const [n,v] of idx) console.log(`  ${n.padEnd(12)} ${(v/refIdx).toFixed(2)}x`);

console.log('\nEconomy index (gold x drop x gather x town x sell):');
for (const [n,p] of rows) {
  const e = p.gold * p.drop * p.gather * p.town * p.sell;
  console.log(`  ${n.padEnd(12)} ${e.toFixed(2)}x`);
}
