// Contact sheet: every species, at every growth stage, in every mood.
//
// Fifteen creatures assembled from five body plans is exactly the sort of
// thing that looks fine in code and produces two identical blobs on
// screen. This renders the lot so a broken path or a plan that reads the
// same as another one is visible rather than shipped.
import { chromium } from 'playwright';
import { SPECIES_LIST } from '../src/data/pets.js';
import { petPortrait, eggPortrait } from '../src/ui/petart.js';

const MOODS = ['content', 'thriving', 'hungry', 'miserable'];
const STAGES = ['hatchling', 'juvenile', 'adult', 'elder'];

const sections = [];

// One row per species, every stage, at content.
sections.push('<h2>Every species, growing up</h2><div class="grid">');
for (const sp of SPECIES_LIST) {
  for (const stage of STAGES) {
    sections.push(`<figure>${petPortrait({ species: sp.id, stage, xp: 0 }, 'content', 110)}
      <figcaption>${sp.icon} ${sp.name}<br><span class="dim">${stage} · ${sp.rarity}</span></figcaption></figure>`);
  }
}
sections.push('</div>');

// Moods, on the adult form.
sections.push('<h2>Moods</h2><div class="grid">');
for (const sp of SPECIES_LIST) {
  for (const mood of MOODS) {
    sections.push(`<figure>${petPortrait({ species: sp.id, stage: 'adult', xp: 0 }, mood, 110)}
      <figcaption>${sp.name}<br><span class="dim">${mood}</span></figcaption></figure>`);
  }
}
sections.push('</div>');

// And the eggs, which are the first thing anybody sees of a species.
sections.push('<h2>Eggs</h2><div class="grid">');
for (const sp of SPECIES_LIST) {
  for (const pct of [0.1, 0.9]) {
    sections.push(`<figure>${eggPortrait(sp.id, pct, 110)}
      <figcaption>${sp.eggName}<br><span class="dim">${Math.round(pct * 100)}%</span></figcaption></figure>`);
  }
}
sections.push('</div>');

const html = `<style>
  body{background:#0d1220;color:#d9e2f5;font-family:system-ui;margin:0;padding:20px}
  h2{font-size:15px;letter-spacing:2px;text-transform:uppercase;color:#4da3ff;margin:22px 0 10px}
  .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
  figure{margin:0;background:#141b2e;border:1px solid #2b3a5e;border-radius:10px;padding:8px;text-align:center}
  figcaption{font-size:10px;color:#8fa0c4;margin-top:4px;line-height:1.4}
  .dim{color:#5a6a8f}
  svg{margin:0 auto;display:block}
</style>${sections.join('')}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1.4 })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.setContent(html);
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/pet-grid.png', fullPage: true });
await b.close();
console.log(`rendered ${SPECIES_LIST.length} species: ${STAGES.length} stages, ${MOODS.length} moods, 2 egg states`);
if (errs.length) { console.log('errors:'); errs.forEach(e => console.log('  !', e)); process.exit(1); }
