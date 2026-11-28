import { avatar } from './town.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = text => String(text ?? '').replace(/^[^\p{L}\p{N}]+/u,'');
const choices = [
  ['skin','Skin tone',['#f3c69e','#e8bb91','#ad7751','#805238','#57392b']],
  ['hair','Hair color',['#76513c','#292725','#e5c779','#ae5438']],
  ['eyes','Eye color',['#41566a','#627f49','#76513b']],
  ['shirt','Clothing',['#6599c6','#c97878','#7da76b','#987bb7']],
  ['style','Hair style',['classic','spiky','bald']]
];
export function creationScreen(d,bg,traits,generation) {
 return `<section class="creation-screen" aria-labelledby="creation-title">
   <header class="creation-brand"><a href="./index.html" aria-label="Return to Idle Realms">‹</a><div><strong>LINEAGE</strong><small>One life ends. A legacy begins.</small></div><span aria-hidden="true">✦</span></header>
   <div class="creation-hero"><div class="creation-hero-shade"></div><div class="creation-intro"><p>YOUR STORY BEGINS</p><h1 id="creation-title">A life of your own.</h1><span>Every great story starts somewhere.</span></div></div>
   <div class="creation-content"><div class="creation-person"><div class="creation-portrait">${avatar(25,d.appearance)}</div><div class="creation-identity"><p>GENERATION ${Number(generation)||1}</p><h2>${esc(d.firstName)} ${esc(d.lastName)}</h2><span>Born ${esc(d.birthYear)}</span><button class="creation-customize" type="button" data-act="customize-draft">Customize character <span aria-hidden="true">›</span></button></div></div>
   <section class="creation-family"><div class="creation-family-image" role="img" aria-label="A welcoming family home"></div><div><p>YOUR BEGINNING</p><h3>${esc(clean(bg?.name))}</h3><span>${esc(bg?.blurb)}</span></div></section>
   <section class="creation-traits"><div class="creation-heading"><div><p>WHAT MAKES YOU, YOU</p><h3>Personality</h3></div><button type="button" data-act="reroll-traits">Reroll traits</button></div><div class="creation-trait-grid">${traits.map((t,i)=>`<article><span class="trait-symbol" aria-hidden="true">${i===0?'✦':'❋'}</span><div><strong>${esc(clean(t.name))}</strong><span>${esc(t.desc)}</span></div></article>`).join('')}</div></section>
   <div class="creation-actions"><button type="button" data-act="reroll-all" class="creation-random">↻ &nbsp; Randomize character</button><button type="button" data-act="begin-life" class="creation-begin">Begin My Life <span aria-hidden="true">→</span></button></div></div>
   <dialog class="creation-dialog" aria-labelledby="customize-title"><div class="customize-header"><div><p>MAKE IT YOURS</p><h2 id="customize-title">Customize your character</h2></div><button type="button" data-act="close-customize" aria-label="Close customization">×</button></div><div class="customize-preview">${avatar(25,d.appearance)}</div><div class="customize-names"><label>First name<input id="inp-first" maxlength="24" value="${esc(d.firstName)}"></label><label>Last name<input id="inp-last" maxlength="24" value="${esc(d.lastName)}"></label><label>Birth year<input id="inp-year" type="number" min="1900" max="2025" value="${esc(d.birthYear)}"></label></div>${choices.map(([key,label,values])=>`<fieldset><legend>${label}</legend><div class="swatches">${values.map((value,i)=>`<label class="swatch ${key==='style'?'style-swatch':''}" title="${esc(label)} ${i+1}"><input type="radio" name="appearance-${key}" data-appearance="${key}" value="${esc(value)}" ${d.appearance?.[key]===value?'checked':''}><span ${key==='style'?'':`style="--swatch:${value}"`}>${key==='style'?esc(value):''}</span><span class="sr-only">${esc(label)} ${key==='style'?esc(value):i+1}</span></label>`).join('')}</div></fieldset>`).join('')}<button type="button" data-act="close-customize" class="creation-begin">Done</button></dialog>
 </section>`;
}
