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
  FIXED_DT,
} from '../config/Constants.js';

import { processSlimeMeleeHit } from '../systems/Combat.js';
import { integrateEntity, clampToLevel } from '../systems/Physics.js';

export function updateEnemies(state) {
  const p  = state.player;
  const dt = FIXED_DT;

  if (state.hitstop > 0) return;

  for (const e of state.enemies) {
    if (!e.alive) continue;
    updateSlime(e, p, state, dt);
  }
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
