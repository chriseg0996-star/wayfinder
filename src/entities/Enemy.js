// ============================================================
// WAYFINDER — Enemy.js — single slime type
// Slime AI: patrol ↔ chase → telegraph → attack → patrol; hurt interrupts and clears wind-up.
// Pure logic. No canvas, no DOM.
//
// **AI e.state → animation clip (Constants.SLIME_AI_TO_ANIM) — see Constants.js table by SLIME_ANIM**
//  patrol     → idle     | chase  → move      | telegraph → telegraph (wind-up, then → attack)
//  attack     → attack   | hurt   → hurt      | (!alive) → death clip (not AI; Combat + animClips)
//
// Hurt: zeros telegraph + attack timers so a hit never leaves a half-started bite (clean transition).
// Death: e.alive false → updateEnemies skips; `death` clip uses deathStartTick in render, not FSM.
//
// Sprite + telegraph gizmo: entityRender + animClips. Readability: Constants READABILITY_SLIME_*,
//   SLIME_TEL_*, READABILITY_TEL_* (visual only; no AI/timer changes).
// ============================================================

import {
  SLIME_PATROL_SPEED, SLIME_CHASE_SPEED,
  SLIME_CHASE_RANGE, SLIME_ATTACK_RANGE,
  SLIME_TELEGRAPH_DUR, SLIME_ATTACK_DUR,
  SLIME_HURT_DUR, SLIME_PATROL_TURN,
  SLIME_LOSE_CHASE_MULT,
  RANGED_AGGRO_RANGE, RANGED_KEEP_MIN, RANGED_KEEP_MAX,
  RANGED_MOVE_SPEED, RANGED_TELEGRAPH_DUR, RANGED_SHOT_COOLDOWN,
  RANGED_PROJECTILE_SPEED, RANGED_PROJECTILE_W, RANGED_PROJECTILE_H,
  RANGED_PROJECTILE_LIFE, RANGED_PROJECTILE_DAMAGE,
  HEAVY_AGGRO_RANGE, HEAVY_MOVE_SPEED, HEAVY_TRIGGER_RANGE,
  HEAVY_TELEGRAPH_DUR, HEAVY_CHARGE_SPEED, HEAVY_CHARGE_DUR,
  HEAVY_RECOVER_DUR, HEAVY_COOLDOWN, HEAVY_DAMAGE, HEAVY_KNOCKBACK, HEAVY_KNOCKUP,
  ENCOUNTER_ARCHER_TELEGRAPH_MAX, ENCOUNTER_ARCHER_DIRECTLINE_MAX,
  ENCOUNTER_BRUTE_ATTACK_MAX_BY_ZONE, ENCOUNTER_BRUTE_TELEGRAPH_GAP_SEC,
  PLAYER_HURT_DUR, PLAYER_HURT_IFRAMES,
  FIXED_DT,
} from '../config/Constants.js';

import { processSlimeMeleeHit, applyDamage, rectsOverlap } from '../systems/Combat.js';
import { emitAttackSwing } from '../systems/CombatFeedback.js';
import { integrateEntity, clampToLevel } from '../systems/Physics.js';

export function updateEnemies(state) {
  const p  = state.player;
  const dt = FIXED_DT;

  if (state.hitstop > 0) return;

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.type === 'slime') {
      updateSlime(e, p, state, dt);
      continue;
    }
    if (e.type === 'ranged') {
      updateRanged(e, p, state, dt);
      continue;
    }
    if (e.type === 'heavy') {
      updateHeavy(e, p, state, dt);
      continue;
    }
    if (e.type === 'projectile') {
      updateProjectile(e, p, state, dt);
    }
  }
  state.enemies = state.enemies.filter(e => e.alive || e.type !== 'projectile');
}

function updateSlime(e, p, state, dt) {
  // Timers
  if (e.hurtTimer     > 0) e.hurtTimer     -= dt;
  if (e.telegraphTimer> 0) e.telegraphTimer -= dt;
  if (e.attackTimer   > 0) e.attackTimer   -= dt;
  if (e.patrolTimer   > 0) e.patrolTimer   -= dt;

  const distX = Math.abs(p.x - e.x);

  switch (e.state) {

    case 'patrol': {
      e.vx = e.patrolDir * SLIME_PATROL_SPEED;
      e.facingRight = e.patrolDir > 0;
      if (e.patrolTimer <= 0) {
        e.patrolDir  *= -1;
        e.patrolTimer = SLIME_PATROL_TURN;
      }
      if (distX < SLIME_CHASE_RANGE && p.hp > 0) {
        e.state = 'chase';
      }
      break;
    }

    case 'chase': {
      const dir = p.x > e.x ? 1 : -1;
      e.vx = dir * SLIME_CHASE_SPEED;
      e.facingRight = dir > 0;
      // Detection/windup range only (damage validation is stricter in Combat: plane + hitbox overlap).
      if (distX <= SLIME_ATTACK_RANGE) {
        e.state          = 'telegraph';
        e.telegraphTimer = SLIME_TELEGRAPH_DUR;
        e.vx             = 0;
      }
      if (distX > SLIME_CHASE_RANGE * SLIME_LOSE_CHASE_MULT) {
        e.state      = 'patrol';
        e.patrolTimer= SLIME_PATROL_TURN;
      }
      break;
    }

    case 'telegraph': {
      e.vx = 0;
      if (e.telegraphTimer <= 0) {
        e.state       = 'attack';
        e.attackTimer = SLIME_ATTACK_DUR;
        emitAttackSwing(state, 'enemy');
        processSlimeMeleeHit(state, e, p, distX);
      }
      break;
    }

    case 'attack': {
      e.vx = 0;
      if (e.attackTimer <= 0) {
        e.state      = 'patrol';
        e.patrolTimer= SLIME_PATROL_TURN;
        e.patrolDir  = e.facingRight ? 1 : -1;
      }
      break;
    }

    case 'hurt': {
      e.telegraphTimer = 0;
      e.attackTimer    = 0;
      if (e.hurtTimer <= 0) {
        e.state       = 'patrol';
        e.patrolTimer = SLIME_PATROL_TURN;
      }
      break;
    }
  }

  integrateEntity(e, state.platforms, dt);
  clampToLevel(e, state.levelW, state.levelH);
  if (!e.grounded) e.vx *= 0.92; // air drag
}

function updateRanged(e, p, state, dt) {
  if (e.hurtTimer > 0) e.hurtTimer -= dt;
  if (e.telegraphTimer > 0) e.telegraphTimer -= dt;
  if (e.shootCooldown > 0) e.shootCooldown -= dt;
  const distX = p.x - e.x;
  const absX = Math.abs(distX);

  if (e.state === 'hurt') {
    if (e.hurtTimer <= 0) e.state = 'idle';
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    return;
  }

  if (e.state === 'telegraph') {
    e.vx = 0;
    if (e.telegraphTimer <= 0) {
      e.state = 'idle';
      e.shootCooldown = RANGED_SHOT_COOLDOWN;
      fireProjectile(state, e, p);
    }
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    return;
  }

  if (absX > RANGED_AGGRO_RANGE || p.hp <= 0) {
    e.vx = 0;
    e.state = 'idle';
  } else {
    e.facingRight = distX > 0;
    if (absX < RANGED_KEEP_MIN) {
      e.vx = distX > 0 ? -RANGED_MOVE_SPEED : RANGED_MOVE_SPEED;
      e.state = 'kite';
    } else if (absX > RANGED_KEEP_MAX) {
      e.vx = distX > 0 ? RANGED_MOVE_SPEED : -RANGED_MOVE_SPEED;
      e.state = 'kite';
    } else {
      e.vx = 0;
      e.state = 'idle';
      if (e.shootCooldown <= 0 && canArcherStartTelegraph(state, e, p)) {
        e.state = 'telegraph';
        e.telegraphTimer = RANGED_TELEGRAPH_DUR;
      }
    }
  }

  integrateEntity(e, state.platforms, dt);
  clampToLevel(e, state.levelW, state.levelH);
}

function fireProjectile(state, e, p) {
  const dir = p.x >= e.x ? 1 : -1;
  emitAttackSwing(state, 'enemy');
  state.enemies.push({
    type: 'projectile',
    alive: true,
    x: e.x + e.w * 0.5 - RANGED_PROJECTILE_W * 0.5 + dir * (e.w * 0.4),
    y: e.y + e.h * 0.45,
    w: RANGED_PROJECTILE_W,
    h: RANGED_PROJECTILE_H,
    vx: dir * RANGED_PROJECTILE_SPEED,
    vy: 0,
    life: RANGED_PROJECTILE_LIFE,
    hp: 1,
    maxHp: 1,
    facingRight: dir > 0,
    state: 'projectile',
    grounded: false,
    hurtTimer: 0,
  });
}

function updateProjectile(e, p, state, dt) {
  e.life -= dt;
  if (e.life <= 0) {
    e.alive = false;
    return;
  }
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  if (e.x + e.w < 0 || e.x > state.levelW || e.y + e.h < 0 || e.y > state.levelH) {
    e.alive = false;
    return;
  }
  if (!rectsOverlap(e, p)) return;
  const dir = p.x > e.x ? 1 : -1;
  applyDamage(state, {
    victim: 'player',
    ref: p,
    sourceId: 'ranged_projectile',
    amount: RANGED_PROJECTILE_DAMAGE,
    knockbackX: dir * 120,
    knockbackY: -120,
    hurtDuration: PLAYER_HURT_DUR,
    iframes: PLAYER_HURT_IFRAMES,
    applyHitstop: true,
  });
  e.alive = false;
}

function updateHeavy(e, p, state, dt) {
  if (e.hurtTimer > 0) e.hurtTimer -= dt;
  if (e.telegraphTimer > 0) e.telegraphTimer -= dt;
  if (e.chargeTimer > 0) e.chargeTimer -= dt;
  if (e.recoverTimer > 0) e.recoverTimer -= dt;
  if (e.attackCooldown > 0) e.attackCooldown -= dt;
  const distX = p.x - e.x;
  const absX = Math.abs(distX);

  if (e.state === 'hurt') {
    e.telegraphTimer = 0;
    e.chargeTimer = 0;
    e.recoverTimer = 0;
    e.hitThisCharge = false;
    if (e.hurtTimer <= 0) e.state = 'idle';
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    return;
  }

  if (e.state === 'telegraph') {
    e.vx = 0;
    if (e.telegraphTimer <= 0) {
      e.state = 'charge';
      e.chargeTimer = HEAVY_CHARGE_DUR;
      e.chargeDir = e.facingRight ? 1 : -1;
      e.hitThisCharge = false;
      emitAttackSwing(state, 'enemy');
    }
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    return;
  }

  if (e.state === 'charge') {
    e.vx = e.chargeDir * HEAVY_CHARGE_SPEED;
    if (!e.hitThisCharge && rectsOverlap(e, p)) {
      applyDamage(state, {
        victim: 'player',
        ref: p,
        sourceId: 'heavy_charge',
        amount: HEAVY_DAMAGE,
        knockbackX: e.chargeDir * HEAVY_KNOCKBACK,
        knockbackY: HEAVY_KNOCKUP,
        hurtDuration: PLAYER_HURT_DUR,
        iframes: PLAYER_HURT_IFRAMES,
        applyHitstop: true,
      });
      e.hitThisCharge = true;
    }
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    if (e.chargeTimer <= 0 || (e.grounded && Math.abs(e.vx) < 1)) {
      e.state = 'recover';
      e.recoverTimer = HEAVY_RECOVER_DUR;
      e.vx = 0;
    }
    return;
  }

  if (e.state === 'recover') {
    e.vx = 0;
    if (e.recoverTimer <= 0) {
      e.state = 'idle';
      e.attackCooldown = HEAVY_COOLDOWN;
    }
    integrateEntity(e, state.platforms, dt);
    clampToLevel(e, state.levelW, state.levelH);
    return;
  }

  if (absX > HEAVY_AGGRO_RANGE || p.hp <= 0) {
    e.vx = 0;
    e.state = 'idle';
  } else {
    e.facingRight = distX > 0;
    if (absX > HEAVY_TRIGGER_RANGE) {
      e.vx = distX > 0 ? HEAVY_MOVE_SPEED : -HEAVY_MOVE_SPEED;
      e.state = 'approach';
    } else {
      e.vx = 0;
      e.state = 'idle';
      if (e.attackCooldown <= 0 && canBruteStartTelegraph(state)) {
        e.state = 'telegraph';
        e.telegraphTimer = HEAVY_TELEGRAPH_DUR;
        state._lastBruteTelegraphTick = state.tick;
      }
    }
  }
  integrateEntity(e, state.platforms, dt);
  clampToLevel(e, state.levelW, state.levelH);
}

function canArcherStartTelegraph(state, self, player) {
  let activeTelegraph = 0;
  let directLine = 0;
  const py = player.y + player.h * 0.5;
  for (const e of state.enemies) {
    if (!e.alive || e.type !== 'ranged') continue;
    if (e.state === 'telegraph') activeTelegraph++;
    if (Math.abs((e.y + e.h * 0.5) - py) <= 28) directLine++;
  }
  if (activeTelegraph >= ENCOUNTER_ARCHER_TELEGRAPH_MAX) return false;
  if (directLine > ENCOUNTER_ARCHER_DIRECTLINE_MAX && Math.abs((self.y + self.h * 0.5) - py) <= 28) {
    return false;
  }
  return true;
}

function canBruteStartTelegraph(state) {
  const maxActive = ENCOUNTER_BRUTE_ATTACK_MAX_BY_ZONE[state.currentZoneId] ?? 1;
  let active = 0;
  for (const e of state.enemies) {
    if (!e.alive || e.type !== 'heavy') continue;
    if (e.state === 'telegraph' || e.state === 'charge') active++;
  }
  if (active >= maxActive) return false;
  const gapTicks = Math.round(ENCOUNTER_BRUTE_TELEGRAPH_GAP_SEC / FIXED_DT);
  const last = state._lastBruteTelegraphTick ?? -999999;
  return (state.tick - last) >= gapTicks;
}
