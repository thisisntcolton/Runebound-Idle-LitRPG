import { games, featuredGame, savesForGames } from './games.js';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saves = savesForGames();
const summary = save => save?.summary?.length ? escape(save.summary.join(' · ')) : 'Your adventure awaits';
const action = save => save ? 'Continue Adventure' : 'Play Now';
const launch = (game, save, label = action(save)) => `<a class="button primary" href="${game.url}">${label}<span aria-hidden="true"> ↗</span></a>`;
const details = game => `<button class="button text-button" type="button" data-details="${game.id}">Game Details <span aria-hidden="true">→</span></button>`;
function render() {
  const featured = featuredGame, save = saves[featured.id];
  document.querySelector('#featured').innerHTML = `<p class="eyebrow"><span class="line"></span> FEATURED WORLD</p><p class="hero-game">${escape(featured.name)}</p><h1>${escape(featured.tagline)}</h1><p class="hero-description">${escape(featured.description)}</p><div class="tags">${featured.features.map(x=>`<span>${escape(x)}</span>`).join('')}</div><div class="actions">${launch(featured,save)}${details(featured)}</div>`;
  const returning = games.filter(g=>saves[g.id]).sort((a,b)=>(saves[b.id].lastPlayed ?? 0)-(saves[a.id].lastPlayed ?? 0));
  document.querySelector('#continue').innerHTML = returning.length ? `<div class="section-heading"><div><p class="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Continue playing</h2></div></div><div class="continue-list">${returning.map(g=>`<a href="${g.url}" class="continue-card" style="--accent:${g.accent}"><span class="continue-mark" aria-hidden="true">${g.symbol}</span><span><strong>${escape(g.name)}</strong><small>${summary(saves[g.id])}</small></span><span aria-hidden="true">→</span></a>`).join('')}</div>` : `<div class="discovery"><div><p class="eyebrow">YOUR STORY STARTS HERE</p><h2>A world for every adventure.</h2><p>Choose a realm below and make it your own.</p></div><a class="button secondary" href="#games">Discover games <span aria-hidden="true">↓</span></a></div>`;
  document.querySelector('#game-grid').innerHTML = games.map(g=>`<article class="game-card" style="--accent:${g.accent}"><div class="cover cover-${g.id}" aria-hidden="true"><span>${g.symbol}</span><small>IDLE REALMS / ${escape(g.name.toUpperCase())}</small></div><div class="card-body"><p class="eyebrow">${escape(g.genre)}</p><h3>${escape(g.name)}</h3><p class="card-tagline">${escape(g.tagline)}</p><p class="card-description">${escape(g.description)}</p><p class="save-summary">${saves[g.id] ? summary(saves[g.id]) : 'Begin a new adventure'}</p><div class="card-actions">${launch(g,saves[g.id],saves[g.id]?'Continue':'Play Now')}${details(g)}</div></div></article>`).join('');
}
const dialog = document.querySelector('#game-dialog'); let opener;
function openDetails(game, trigger) {
  opener = trigger; const save = saves[game.id];
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-cover cover cover-${game.id}" style="--accent:${game.accent}" aria-hidden="true"><span>${game.symbol}</span></div><div class="dialog-body"><button class="dialog-close" type="button" aria-label="Close game details">×</button><p class="eyebrow">${escape(game.genre)}</p><h2 id="dialog-title">${escape(game.name)}</h2><p class="dialog-tagline">${escape(game.tagline)}</p><p>${escape(game.description)}</p><h3>Explore this world</h3><ul>${game.features.map(f=>`<li>${escape(f)}</li>`).join('')}</ul><p class="save-summary">${save ? `Your adventure: ${summary(save)}` : 'No saved adventure yet.'}${game.version ? ` · Version ${escape(game.version)}` : ''}</p>${launch(game,save)}</div>`;
  dialog.showModal(); dialog.querySelector('.dialog-close').focus();
}
document.addEventListener('click', e => { const button = e.target.closest('[data-details]'); if (button) openDetails(games.find(g=>g.id===button.dataset.details),button); if (e.target.closest('.dialog-close')) dialog.close(); if (e.target.closest('.mobile-menu a')) document.querySelector('.mobile-menu').open = false; });
dialog.addEventListener('click', e=>{ if(e.target===dialog) dialog.close(); });
dialog.addEventListener('close',()=>opener?.focus());
dialog.addEventListener('keydown', e=>{ if (e.key === 'Escape') { e.preventDefault(); dialog.close(); } });
window.addEventListener('storage',()=>{saves=savesForGames();render();});
const updates = [{ game:'Blackroot', title:'Mobile First HUD', version:'0.8.9', text:'A compact mobile interface and adjustable touch controls.' }];
document.querySelector('#updates').innerHTML = updates.map(u=>`<article class="update"><div class="update-icon" aria-hidden="true">ᛉ</div><div><p class="eyebrow">${escape(u.game)} · UPDATE ${escape(u.version)}</p><h3>${escape(u.title)}</h3><p>${escape(u.text)}</p></div><button class="button text-button" type="button" data-details="blackroot">Explore Blackroot →</button></article>`).join('');
async function checkAccount() { const el=document.querySelector('#hub-account'); try { const res=await fetch('/api/me',{credentials:'same-origin'}); if (!(res.headers.get('content-type')||'').includes('application/json')) throw new Error('Unavailable'); const data=await res.json(); el.textContent=data.user?.name ? `Signed in as ${data.user.name}` : 'Playing locally'; } catch { el.textContent='Playing locally'; } }
render(); checkAccount();
