import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import './style.css';
import './mobile.css';

const parent = document.getElementById('game')!;
function measureViewport() {
  const viewport = window.visualViewport;
  const height = viewport && Math.abs(viewport.scale - 1) < 0.01
    ? Math.min(window.innerHeight, viewport.height) : window.innerHeight;
  document.documentElement.style.setProperty('--orc-visible-height', `${Math.floor(height)}px`);
}
measureViewport();
const game = new Phaser.Game({
  type: Phaser.AUTO, parent, width: 360, height: 640,
  pixelArt: true, backgroundColor: '#283322',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 }, scene: [MainScene],
});
let frame = 0;
function scheduleResize() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    measureViewport();
    if (game.isBooted) game.scale.resize(parent.clientWidth,parent.clientHeight);
  });
}
const observer = new ResizeObserver(scheduleResize);
observer.observe(parent);
window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);
window.visualViewport?.addEventListener('resize', scheduleResize);
game.events.once(Phaser.Core.Events.DESTROY, () => {
  observer.disconnect(); cancelAnimationFrame(frame);
  window.removeEventListener('resize', scheduleResize);
  window.removeEventListener('orientationchange', scheduleResize);
  window.visualViewport?.removeEventListener('resize', scheduleResize);
});

document.querySelector(".orc-tools")?.addEventListener("click",()=>{const settings=document.querySelector<HTMLDetailsElement>(".orc-settings");if(settings)settings.open=false;});

// Keep browser selection and long-press menus out of the game surface.
const gameplayTarget=(target:EventTarget|null)=>target instanceof Element && !!target.closest('#game,#orc-header,.orc-readable-hud');
const suppress=(event:Event)=>{if(gameplayTarget(event.target))event.preventDefault();};
document.addEventListener('selectstart',suppress);
document.addEventListener('contextmenu',suppress);
game.events.once(Phaser.Core.Events.DESTROY,()=>{document.removeEventListener('selectstart',suppress);document.removeEventListener('contextmenu',suppress);});
