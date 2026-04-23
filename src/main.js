// ============================================================
// WAYFINDER — main.js
// Entry point. Wires canvas + state + game loop.
// ============================================================

import { createGameState } from './state/GameState.js';
import { Game }            from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const state  = createGameState();
const game   = new Game(canvas, state);

game.start();

// Controls hint on console
console.log(`
WAYFINDER — Controls
─────────────────────
Move:    A / D  or  ← →
Jump:    W / Space / ↑
Attack:  J / Z
Dodge:   K / X
Debug:   F3
`);
