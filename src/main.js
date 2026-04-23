// ============================================================
// WAYFINDER — main.js
// Entry point. Wires canvas + state + game loop.
// ?dev=1 — JSON: template + stripped live state (after a short sim delay)
// ============================================================

import { createGameState } from './state/GameState.js';
import { Game }            from './core/Game.js';
import { assertGameStateTemplateSerializable, assertLiveStateSerializableWhenStripped } from './dev/assertSerializable.js';
import { loadSpriteRegistry } from './render/spriteRegistry.js';
import { loadParallaxLayers } from './render/backgroundLayers.js';
import { loadWorldTiles } from './systems/Render.js';

loadSpriteRegistry();
loadParallaxLayers();
loadWorldTiles();
const state  = createGameState();
const canvas = document.getElementById('game-canvas');
const game   = new Game(canvas, state);

const dev = new URLSearchParams(window.location.search).get('dev') === '1';

if (dev) {
  try {
    assertGameStateTemplateSerializable();
    console.log('[dev] Serializable template round-trips OK');
  } catch (err) {
    console.error('[dev] template serialize check failed', err);
  }
}

game.start();

if (dev) {
  setTimeout(() => {
    try {
      assertLiveStateSerializableWhenStripped(state);
      console.log('[dev] Stripped live state (after sim) round-trips OK');
    } catch (err) {
      console.error('[dev] live state serialize check failed', err);
    }
  }, 300);
}

// Controls hint on console
console.log(`
WAYFINDER — Controls
─────────────────────
Move:    A / D  or  ← →
Jump:    W / Space / ↑
Attack:  J / Z
Dodge:   K / X
Skill 1: 1 (Burst Step)
Skill 2: 2 (Arc Burst)
Skill 3: 3 (Guard Pulse)
Next:    N  (after win — go to next area, if any)
Restart: R  (new run from zone 1; after loss)
Debug:   F3  or  \`  (backtick)
`);
