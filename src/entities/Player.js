// ============================================================
// WAYFINDER — Player.js
// Pure logic. Reads state + input snapshot. Mutates state only.
// No canvas, no DOM, no Input import.
//
// **Gameplay FSM (`p.state`) → animation row keys (Constants.PLAYER_ANIM)**
// Full table: `Constants.js` (PLAYER_SHEET_PX / PLAYER_ANIM block). Render: getPlayerAnimKey.
//
// Locomotion (loop clips — names match 1:1: idle, run, jump, fall):
//   `applyPlayerLocomotionState()` only on the free-movement path, after input/jump; sets p.state
//   from grounded + |vx| vs PLAYER_LOCO_RUN_VX, or air + vy sign.
//
// One-shots (same wall times as these timers; anim distribution in PLAYER_ANIM `fps`):
//   attack — p.state 'attack' + p.comboIndex 1..3 → clip attack_1/2/3; attackTimer, startAttack();
//   dodge  — p.state 'dodge'; p.dodgeTimer, DODGE_DURATION;
//   hurt   — p.state 'hurt'; p.hurtTimer, PLAYER_HURT_DUR (set from Combat, not here).
//
// Transitions (this file, top to bottom in updatePlayer): hitstop → dead → hurt → dodge →
//   dodge start from buffer → attack → neutral attack input → free move + applyPlayerLocomotionState.
//
// dead: p.state = 'dead', early return; clip idles until real death art (see animKeys).
// Sprite: PLAYER_ANIM → animClips → entityRender. Visual readability (stroke/shadow): Constants READABILITY_PLAYER_*;
//   no extra fields or sim changes — tuning render-side only.
// ============================================================

import {
  PLAYER_SPEED, AIR_CONTROL,
  PLAYER_GROUND_ACCEL, PLAYER_GROUND_TURN_MULT, PLAYER_GROUND_DECEL,
  PLAYER_AIR_ACCEL, PLAYER_AIR_TURN_MULT, PLAYER_AIR_DRAG,
  JUMP_FORCE, JUMP_CUT_MULTIPLIER, JUMP_RISE_GRAVITY_MULT, JUMP_FALL_GRAVITY_MULT,
  COYOTE_TIME, JUMP_BUFFER_TIME,
  DODGE_BUFFER_TIME, DODGE_SPEED, DODGE_DURATION, DODGE_IFRAMES, DODGE_COOLDOWN,
  COMBO_HITS, COMBO_WINDOW,
  ATTACK_STARTUP, ATTACK_ACTIVE, ATTACK_RECOVERY,
  ATTACK_MIN_INTERVAL,
  PLAYER_LOCO_RUN_VX,
  ABILITY_MOVE_CD, ABILITY_MOVE_DUR, ABILITY_MOVE_SPEED, ABILITY_MOVE_IFRAMES,
  ABILITY_DAMAGE_CD, ABILITY_DAMAGE_DAMAGE, ABILITY_DAMAGE_W, ABILITY_DAMAGE_H,
  ABILITY_GUARD_CD, ABILITY_GUARD_DUR, ABILITY_GUARD_RADIUS, ABILITY_GUARD_KB,
  FIXED_DT,
} from '../config/Constants.js';

import { processPlayerMeleeHits, processAbilityDamageBurst } from '../systems/Combat.js';
import { emitAttackSwing } from '../systems/CombatFeedback.js';
import { getPlayerMoveSpeedScale }   from '../systems/Progression.js';
import { integrateEntity, clampToLevel } from '../systems/Physics.js';

export function updatePlayer(state, input) {
  const p = state.player;
  const dt = FIXED_DT;

  // Global hitstop — freeze everything
  if (state.hitstop > 0) {
    return;
  }

  // --- Timers ---
  if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt;
  if (p.iframeTimer   > 0) p.iframeTimer   -= dt;
  if (p.hurtTimer     > 0) p.hurtTimer     -= dt;
  if (p.comboWindow   > 0) p.comboWindow   -= dt;
  else if (p.state !== 'attack') p.comboIndex = 0;
  if (p.attackInputCooldown > 0) p.attackInputCooldown -= dt;
  if (p.abilityMoveCd > 0) p.abilityMoveCd -= dt;
  if (p.abilityMoveTimer > 0) p.abilityMoveTimer -= dt;
  if (p.abilityDamageCd > 0) p.abilityDamageCd -= dt;
  if (p.abilityDamageFxTimer > 0) p.abilityDamageFxTimer -= dt;
  if (p.abilityGuardCd > 0) p.abilityGuardCd -= dt;
  if (p.abilityGuardTimer > 0) p.abilityGuardTimer -= dt;

  // Jump buffer
  if (input.jumpPressed) p.jumpBuffer = JUMP_BUFFER_TIME;
  else if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

  // Dodge buffer (responsive dodge off cooldown or after attack)
  if (input.dodgePressed) p.dodgeBuffer = DODGE_BUFFER_TIME;
  else if (p.dodgeBuffer > 0) p.dodgeBuffer -= dt;

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
    playerIntegrate(p, state);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Ability 1 — Mobility (Burst Step): fast committed burst.
  if (p.abilityMoveTimer > 0) {
    p.state = 'dodge';
    p.vx = p.dodgeDir * ABILITY_MOVE_SPEED;
    playerIntegrate(p, state);
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
    playerIntegrate(p, state);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Dodge start (buffered: dodge may have been pressed during attack)
  if (p.dodgeBuffer > 0 && p.dodgeCooldown <= 0 && p.state !== 'attack') {
    p.dodgeBuffer   = 0;
    p.state         = 'dodge';
    p.dodgeTimer    = DODGE_DURATION;
    p.iframeTimer   = DODGE_IFRAMES;
    p.dodgeCooldown = DODGE_COOLDOWN;
    p.dodgeDir      = p.facingRight ? 1 : -1;
    if (input.left)  p.dodgeDir = -1;
    if (input.right) p.dodgeDir = 1;
    playerIntegrate(p, state);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // --- Attack ---
  if (p.state === 'attack') {
    p.attackTimer -= dt;
    p.vx = 0;

    const ci  = p.comboIndex - 1;
    const su  = ATTACK_STARTUP[ci]  ?? ATTACK_STARTUP[0];
    const act = ATTACK_ACTIVE[ci]  ?? ATTACK_ACTIVE[0];
    const re  = ATTACK_RECOVERY[ci] ?? ATTACK_RECOVERY[0];
    const tot = su + act + re;
    const t   = tot - p.attackTimer;
    p.attackActive = t >= su && t < su + act;

    if (p.attackActive) {
      processPlayerMeleeHits(state, p);
    }

    // Chain next hit
    if (input.attackPressed && p.comboWindow > 0 && p.comboIndex < COMBO_HITS) {
      startAttack(p, state);
      playerIntegrate(p, state);
      clampToLevel(p, state.levelW, state.levelH);
      return;
    }

    if (p.attackTimer <= 0) {
      p.attackActive = false;
      p.state = 'idle';
      p.attackInputCooldown = ATTACK_MIN_INTERVAL;
    }
    playerIntegrate(p, state);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Attack input (neutral) — respect recovery gap so player cannot machine-gun
  if (input.attackPressed && p.grounded && p.attackInputCooldown <= 0) {
    startAttack(p, state);
    playerIntegrate(p, state);
    clampToLevel(p, state.levelW, state.levelH);
    return;
  }

  // Abilities (simple priority: mobility > damage > guard)
  if (input.skill1Pressed && p.abilityMoveCd <= 0 && p.state !== 'attack') {
    p.abilityMoveCd = ABILITY_MOVE_CD;
    p.abilityMoveTimer = ABILITY_MOVE_DUR;
    p.iframeTimer = Math.max(p.iframeTimer, ABILITY_MOVE_IFRAMES);
    p.dodgeDir = p.facingRight ? 1 : -1;
    if (input.left) p.dodgeDir = -1;
    if (input.right) p.dodgeDir = 1;
    p.state = 'dodge';
    return;
  }
  if (input.skill2Pressed && p.abilityDamageCd <= 0 && p.state !== 'attack') {
    p.abilityDamageCd = ABILITY_DAMAGE_CD;
    p.abilityDamageFxTimer = 0.14;
    processAbilityDamageBurst(state, p, ABILITY_DAMAGE_W, ABILITY_DAMAGE_H, ABILITY_DAMAGE_DAMAGE);
    emitAttackSwing(state, 'player');
    return;
  }
  if (input.skill3Pressed && p.abilityGuardCd <= 0 && p.state !== 'attack') {
    p.abilityGuardCd = ABILITY_GUARD_CD;
    p.abilityGuardTimer = ABILITY_GUARD_DUR;
    p.iframeTimer = Math.max(p.iframeTimer, ABILITY_GUARD_DUR);
    pulseGuardControl(state, p);
    return;
  }

  // --- Free movement: ground friction / air drag + acceleration ---
  if (p.grounded) p.jumpVarActive = false;

  applyPlayerHorizontal(p, input, dt);

  // Facing (only when we intend horizontal movement; attack/dodge set separately)
  if (input.left)  p.facingRight = false;
  if (input.right) p.facingRight = true;

  // --- Jump ---
  const canJump = p.grounded || p.coyoteTimer > 0;
  if (p.jumpBuffer > 0 && canJump) {
    p.vy         = -JUMP_FORCE;
    p.jumpBuffer = 0;
    p.coyoteTimer = 0;
    p.grounded   = false;
    p.jumpVarActive = true;
  }

  // Variable hop: one cut on release, not every airborne frame
  if (!input.jump && p.vy < 0 && p.jumpVarActive) {
    p.vy           *= JUMP_CUT_MULTIPLIER;
    p.jumpVarActive = false;
  }

  // Locomotion only: sets p.state to idle | run | jump | fall (clip keys = same names).
  // Not run during attack, dodge, hurt, or hitstop.
  applyPlayerLocomotionState(p);

  playerIntegrate(p, state);
  clampToLevel(p, state.levelW, state.levelH);
}

/**
 * Looping animation drive: `p.state` = clip key for idle, run, jump, fall.
 * @param {object} p
 */
function applyPlayerLocomotionState(p) {
  if (!p.grounded) {
    p.state = p.vy < 0 ? 'jump' : 'fall';
    return;
  }
  if (Math.abs(p.vx) > PLAYER_LOCO_RUN_VX) {
    p.state = 'run';
    return;
  }
  p.state = 'idle';
}

// --- Physics helpers (movement + jump; combat unchanged) ---

function moveToward(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return current;
}

function setPlayerGravityScale(p) {
  p._gravityScale = 1;
  if (p.grounded) return;
  p._gravityScale = p.vy < 0 ? JUMP_RISE_GRAVITY_MULT : JUMP_FALL_GRAVITY_MULT;
}

function playerIntegrate(p, state) {
  setPlayerGravityScale(p);
  integrateEntity(p, state.platforms, FIXED_DT);
}

function applyPlayerHorizontal(p, input, dt) {
  const move = getPlayerMoveSpeedScale(p);
  const gMax = PLAYER_SPEED * move;
  const aMax = PLAYER_SPEED * AIR_CONTROL * move;

  let tVel;
  if (input.left) tVel = -1;
  else if (input.right) tVel = 1;
  else tVel = 0;
  tVel = tVel * (p.grounded ? gMax : aMax);

  if (p.grounded) {
    if (input.left || input.right) {
      const turn = tVel !== 0 && p.vx !== 0 && (tVel > 0) !== (p.vx > 0);
      const step = (turn ? PLAYER_GROUND_TURN_MULT : 1) * PLAYER_GROUND_ACCEL * dt;
      p.vx = moveToward(p.vx, tVel, step);
    } else {
      p.vx = moveToward(p.vx, 0, PLAYER_GROUND_DECEL * dt);
    }
  } else {
    if (input.left || input.right) {
      const turn = tVel !== 0 && p.vx !== 0 && (tVel > 0) !== (p.vx > 0);
      const step = (turn ? PLAYER_AIR_TURN_MULT : 1) * PLAYER_AIR_ACCEL * dt;
      p.vx = moveToward(p.vx, tVel, step);
    } else {
      p.vx = moveToward(p.vx, 0, PLAYER_AIR_DRAG * dt);
    }
  }
}

/** One shot per index: FSM 'attack' + comboIndex 1..3 → clip attack_1 / attack_2 / attack_3. */
function startAttack(p, state) {
  if (p.comboIndex >= COMBO_HITS) p.comboIndex = 0;
  p.comboIndex += 1;
  const ci  = p.comboIndex - 1;
  const su  = ATTACK_STARTUP[ci]  ?? ATTACK_STARTUP[0];
  const act = ATTACK_ACTIVE[ci]  ?? ATTACK_ACTIVE[0];
  const re  = ATTACK_RECOVERY[ci] ?? ATTACK_RECOVERY[0];
  const tot = su + act + re;
  p.attackTimer  = tot;
  p.comboWindow  = tot + COMBO_WINDOW;
  p.attackActive = false;
  p.state        = 'attack';
  p.vx           = 0;
  emitAttackSwing(state, 'player');
}

function pulseGuardControl(state, p) {
  for (const e of state.enemies) {
    if (!e.alive || e.type === 'projectile') continue;
    const cx = e.x + e.w * 0.5;
    const cy = e.y + e.h * 0.5;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.5;
    const dx = cx - px;
    const dy = cy - py;
    const d2 = dx * dx + dy * dy;
    if (d2 > ABILITY_GUARD_RADIUS * ABILITY_GUARD_RADIUS) continue;
    const dir = dx >= 0 ? 1 : -1;
    e.vx = dir * ABILITY_GUARD_KB;
    e.vy = Math.min(e.vy, -180);
    if (e.state !== 'dead') {
      e.state = 'hurt';
      e.hurtTimer = Math.max(e.hurtTimer ?? 0, 0.18);
    }
  }
}
