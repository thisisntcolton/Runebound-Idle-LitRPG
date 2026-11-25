// ============================================================
// LINEAGE — Entry Point
// ============================================================
import { loadGame, saveGame } from './core/save.js';
import { ensureDraft } from './systems/lifecycle.js';
import { renderAll, bindEvents } from './ui/render.js';

loadGame();
ensureDraft();
bindEvents();
renderAll();

window.addEventListener('beforeunload', saveGame);
