// ============================================================
// WAYFINDER — Player.js
// Pure logic. Reads state + input snapshot. Mutates state only.
// No canvas, no DOM, no Input import.
// ============================================================

import {
  PLAYER_SPEED, AIR_CONTROL,
  JUMP_FORCE, JUMP_CUT_FACTOR, COYOTE_TIME, JUMP_BUFFER_TIME,
  DODGE_SPEED, DODGE_DURATION, DODGE_IFRAMES, DODGE_COOLDOWN,
  COMBO_HITS, COMBO_WINDOW,
  ATTACK_DURATION, ATTACK_ACTIVE, ATTACK_DAMAGE, ATTACK_KNOCKBACK,
  ATTACK_RANGE_W, ATTACK_RANGE_H,
  HITSTOP_DURATION,
  FIXED_DT,
} from '../config/Constants.js';

import { integrateEntity, clampToLevel } from '../systems/Physics.js';

export function updatePlayer(state, input) {
  const p = state.player;
  const dt = FIXED_DT;

  // Global hitstop — freeze everything
  if (state.hitstop > 0) {
    state.hitstop -= dt;
    return;
  }

  // --- Timers ---
  if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt;
  if (p.iframeTimer   > 0) p.iframeTimer   -= dt;
  if (p.hurtTimer     > 0) p.hurtTimer     -= dt;
  if (p.comboWindow   > 0) p.comboWindow   -= dt;
  else if (p.state !== 'attack') p.comboIndex = 0;

  // Jump buffer
  if (input.jumpPressed) p.jumpBuffer = JUMP_BUFFER_TIME;
  else if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

  // Coyote time
  if (p.grounded) {
    p.wasGrounded = true;
    p.coyoteTimer = COYOTE_TIME;
  } else {
    if (p.wasGrounded) {
      p.wasGrounded = false;
    }
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
  }

  // --- Dead ---
  if (p.hp <= 0) { p.state = 'dead'; return; }

  // --- Hurt ---
  if (p.state === 'hurt') {
    if (p.hurtTimer <= 0) p.state = 'idle';
    integrateEntity(p, state.platforms, dt);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // --- Dodge ---
  if (p.state === 'dodge') {
    p.dodgeTimer -= dt;
    p.vx = p.dodgeDir * DODGE_SPEED;
    if (p.dodgeTimer <= 0) {
      p.state = 'idle';
      p.vx = 0;
    }
    integrateEntity(p, state.platforms, dt);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Dodge input
  if (input.dodgePressed && p.dodgeCooldown <= 0 && p.state !== 'attack') {
    p.state      = 'dodge';
    p.dodgeTimer = DODGE_DURATION;
    p.iframeTimer= DODGE_IFRAMES;
    p.dodgeCooldown = DODGE_COOLDOWN;
    p.dodgeDir   = p.facingRight ? 1 : -1;
    if (input.left)  p.dodgeDir = -1;
    if (input.right) p.dodgeDir =  1;
    integrateEntity(p, state.platforms, dt);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // --- Attack ---
  if (p.state === 'attack') {
    p.attackTimer -= dt;
    p.vx = 0;

    // Active window
    const dur = ATTACK_DURATION[p.comboIndex - 1] || ATTACK_DURATION[0];
    const act = ATTACK_ACTIVE[p.comboIndex - 1]   || ATTACK_ACTIVE[0];
    p.attackActive = p.attackTimer > (dur - act);

    if (p.attackActive) {
      tryHitEnemies(p, state);
    }

    // Chain next hit
    if (input.attackPressed && p.comboWindow > 0 && p.comboIndex < COMBO_HITS) {
      startAttack(p, state);
      integrateEntity(p, state.platforms, dt);
      clampToLevel(p, state.levelW, state.levelH);
      return;
    }

    if (p.attackTimer <= 0) {
      p.attackActive = false;
      p.state = 'idle';
    }
    integrateEntity(p, state.platforms, dt);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Attack input
  if (input.attackPressed && p.grounded) {
    startAttack(p, state);
    integrateEntity(p, state.platforms, dt);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // --- Horizontal movement ---
  const speed = p.grounded ? PLAYER_SPEED : PLAYER_SPEED * AIR_CONTROL;
  if (input.left) {
    p.vx = -speed;
    p.facingRight = false;
  } else if (input.right) {
    p.vx = speed;
    p.facingRight = true;
  } else {
    p.vx = 0;
  }

  // --- Jump ---
  const canJump = p.grounded || p.coyoteTimer > 0;
  if (p.jumpBuffer > 0 && canJump) {
    p.vy = -JUMP_FORCE;
    p.jumpBuffer = 0;
    p.coyoteTimer = 0;
    p.grounded = false;
  }

  // Variable jump height — cut on release
  if (!input.jump && p.vy < 0) {
    p.vy *= 1 - JUMP_CUT_FACTOR * (1 - Math.min(1, Math.abs(p.vy) / JUMP_FORCE));
  }

  // --- State machine (visual state) ---
  if (!p.grounded) {
    p.state = p.vy < 0 ? 'jump' : 'fall';
  } else if (p.vx !== 0) {
    p.state = 'run';
  } else {
    p.state = 'idle';
  }

  integrateEntity(p, state.platforms, dt);
  clampToLevel(p, state.levelW, state.levelH);
}

function startAttack(p, state) {
  if (p.comboIndex >= COMBO_HITS) p.comboIndex = 0;
  p.comboIndex += 1;
  const dur = ATTACK_DURATION[p.comboIndex - 1];
  p.attackTimer  = dur;
  p.comboWindow  = dur + COMBO_WINDOW;
  p.attackActive = false;
  p.state        = 'attack';
  p.vx           = 0;
}

function tryHitEnemies(p, state) {
  const hitbox = getAttackHitbox(p);
  const dmg   = ATTACK_DAMAGE[p.comboIndex - 1]    || ATTACK_DAMAGE[0];
  const kb    = ATTACK_KNOCKBACK[p.comboIndex - 1] || ATTACK_KNOCKBACK[0];

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e._hitThisSwing) continue;
    if (rectsOverlap(hitbox, e)) {
      e.hp -= dmg;
      e._hitThisSwing = true;
      e.vx = (p.facingRight ? 1 : -1) * kb;
      e.vy = -200;
      e.state = 'hurt';
      e.hurtTimer = 0.25;
      if (e.hp <= 0) { e.alive = false; e.state = 'dead'; }
      state.hitstop = HITSTOP_DURATION;
    }
  }
}

function getAttackHitbox(p) {
  return {
    x: p.facingRight ? p.x + p.w : p.x - ATTACK_RANGE_W,
    y: p.y + (p.h / 2) - ATTACK_RANGE_H / 2,
    w: ATTACK_RANGE_W,
    h: ATTACK_RANGE_H,
  };
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Clear per-swing hit flags at attack start / end
export function clearHitFlags(state) {
  for (const e of state.enemies) e._hitThisSwing = false;
}
