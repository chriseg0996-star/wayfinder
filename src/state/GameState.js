// ============================================================
// WAYFINDER — GameState.js
// Plain serializable object. No methods. No DOM refs. No canvas.
// This object can be sent over the wire in Phase 2 unchanged.
// ============================================================

import {
  PLAYER_MAX_HP, PLAYER_W, PLAYER_H,
  SLIME_MAX_HP, SLIME_W, SLIME_H,
  CANVAS_W, CANVAS_H
} from '../config/Constants.js';

export function createGameState() {
  return {
    tick: 0,

    player: {
      x: 120,
      y: 300,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      facingRight: true,

      // FSM
      state: 'idle',       // idle | run | jump | fall | dodge | attack | hurt | dead

      // Jump
      grounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      wasGrounded: false,

      // Dodge
      dodgeTimer: 0,
      dodgeCooldown: 0,
      dodgeDir: 1,
      iframeTimer: 0,

      // Combat
      comboIndex: 0,
      attackTimer: 0,
      attackActive: false,
      comboWindow: 0,
      hitstopTimer: 0,

      // Hurt
      hurtTimer: 0,
    },

    enemies: [
      makeSlime(420, 380),
      makeSlime(700, 200),
      makeSlime(820, 380),
    ],

    // Hitstop applies globally (both player + enemies freeze)
    hitstop: 0,

    // Camera
    camera: {
      x: 0,
      y: 0,
    },

    // Level geometry — static platforms
    platforms: [
      // Ground
      { x: 0,   y: 420, w: CANVAS_W * 2, h: 120 },
      // Floating platforms
      { x: 300, y: 340, w: 160, h: 20 },
      { x: 560, y: 260, w: 180, h: 20 },
      { x: 800, y: 180, w: 140, h: 20 },
      { x: 160, y: 260, w: 120, h: 20 },
    ],

    levelW: CANVAS_W * 2,
    levelH: CANVAS_H,

    debug: false,
  };
}

function makeSlime(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: SLIME_W,
    h: SLIME_H,
    hp: SLIME_MAX_HP,
    maxHp: SLIME_MAX_HP,
    facingRight: false,
    alive: true,

    // FSM
    state: 'patrol',   // patrol | chase | telegraph | attack | hurt | dead

    patrolDir: 1,
    patrolTimer: 0,
    chaseTimer: 0,
    telegraphTimer: 0,
    attackTimer: 0,
    hurtTimer: 0,
    hitstopTimer: 0,
    grounded: false,
  };
}
