// ============================================================
// WAYFINDER — main.js
// Entry point. Wires canvas + state + game loop.
// Add ?dev=1 to run JSON serializability check on the initial state template.
// ============================================================

import { createGameState } from './state/GameState.js';
import { Game }            from './core/Game.js';
import { assertGameStateTemplateSerializable } from './dev/assertSerializable.js';

if (new URLSearchParams(window.location.search).get('dev') === '1') {
  try {
    assertGameStateTemplateSerializable();
    console.log('[dev] createGameState() is JSON round-trip safe');
  } catch (err) {
    console.error('[dev] serialize check failed', err);
  }
}

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
Restart: R  (after win/lose, or to reset a finished round)
Debug:   F3  or  \`  (backtick)
`);
