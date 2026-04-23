// ============================================================
// WAYFINDER — Game.js
// Fixed timestep accumulator loop.
// Orchestrates: input → update → render.
// Never contains gameplay logic.
// ============================================================

import { FIXED_DT, CANVAS_W, CANVAS_H } from '../config/Constants.js';
import { snapshotWithEdge }              from './Input.js';
import { updateCamera }                  from './Camera.js';
import { clearHitFlags }   from '../systems/Combat.js';
import { updatePlayer }    from '../entities/Player.js';
import { updateEnemies }                 from '../entities/Enemy.js';
import { render }                        from '../systems/Render.js';
import { renderUI }                      from '../systems/UI.js';
import { resetRun }                      from '../state/GameState.js';

export class Game {
  constructor(canvas, state) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.state   = state;

    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    this._accumulator  = 0;
    this._lastTime     = null;
    this._rafId        = null;

    // FPS tracking
    this._fpsSamples   = [];
    this._fps          = 60;

    // Bind loop
    this._loop = this._loop.bind(this);
  }

  start() {
    this._lastTime = performance.now();
    this._rafId    = requestAnimationFrame(this._loop);
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _loop(now) {
    this._rafId = requestAnimationFrame(this._loop);

    let elapsed = (now - this._lastTime) / 1000;
    this._lastTime = now;

    // FPS
    this._fpsSamples.push(elapsed);
    if (this._fpsSamples.length > 30) this._fpsSamples.shift();
    const avgDt = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length;
    this._fps = Math.round(1 / avgDt);

    // Cap spiral of death
    if (elapsed > 0.1) elapsed = 0.1;

    this._accumulator += elapsed;

    // Fixed update steps
    while (this._accumulator >= FIXED_DT) {
      const input = snapshotWithEdge();
      this._update(input);
      this._accumulator -= FIXED_DT;
    }

    // Render with interpolation alpha
    const alpha = this._accumulator / FIXED_DT;
    this._render(alpha);
  }

  _update(input) {
    const state = this.state;

    if (state.roundState !== 'playing') {
      if (input.restartPressed) resetRun(state);
      if (input.debugPressed) state.debug = !state.debug;
      return;
    }

    state.tick++;

    // Debug toggle
    if (input.debugPressed) state.debug = !state.debug;

    // Clear per-tick hit flags
    clearHitFlags(state);

    // Systems update order matters
    updatePlayer(state, input);
    updateEnemies(state);
    updateCamera(state);

    if (state.player.state === 'dead' || state.player.hp <= 0) {
      state.roundState = 'lose';
    } else if (state.enemies.every(e => !e.alive)) {
      state.roundState = 'win';
    }
  }

  _render(alpha) {
    render(this.ctx, this.state, alpha);
    renderUI(this.ctx, this.state, this._fps);
  }
}
