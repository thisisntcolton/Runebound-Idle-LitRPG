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
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 }, scene: [MainScene],
});
let frame = 0;
function scheduleResize() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    measureViewport();
    if (game.isBooted) game.scale.refresh();
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
