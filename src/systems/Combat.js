// ============================================================
// WAYFINDER — Combat.js
// Central damage + melee resolution. Player/Enemy do not apply HP.
// ============================================================

import {
  HITSTOP_DURATION,
  ATTACK_KNOCKBACK, ATTACK_DAMAGE,
  ATTACK_RANGE_W, ATTACK_RANGE_H,
  SLIME_HURT_DUR,
  PLAYER_HURT_DUR, PLAYER_HURT_IFRAMES,
  SLIME_ATTACK_DAMAGE, SLIME_KNOCKBACK, SLIME_KNOCKUP,
  ENEMY_ON_HIT_KB_Y, SLIME_MELEE_REACH, SLIME_MELEE_FEET_Y_TOL, SLIME_MELEE_Y_PAD,
} from '../config/Constants.js';
import { getPlayerDamageMultiplier, awardSlimeKillXp } from './Progression.js';

/**
 * Single entry for all damage. Call from combat resolution only.
 * @param {object} state
 * @param {object} packet
 * @param {'player' | 'enemy'} packet.victim
 * @param {object} packet.ref - player or enemy entity
 * @param {string} [packet.sourceId] - e.g. 'player_melee' | 'slime_melee' (for analytics / future)
 * @param {number} packet.amount
 * @param {number} packet.knockbackX
 * @param {number} packet.knockbackY
 * @param {number} [packet.hurtDuration]
 * @param {number} [packet.iframes] - player victim only
 * @param {boolean} [packet.applyHitstop]
 * @returns {boolean} true if damage was applied
 */
export function applyDamage(state, packet) {
  const {
    victim, ref, amount, knockbackX, knockbackY,
    hurtDuration, iframes, applyHitstop = true,
  } = packet;

  if (victim === 'enemy') {
    return applyDamageToEnemy(state, ref, {
      amount, knockbackX, knockbackY, hurtDuration, applyHitstop,
    });
  }
  if (victim === 'player') {
    return applyDamageToPlayer(state, ref, {
      amount, knockbackX, knockbackY, hurtDuration, iframes, applyHitstop,
    });
  }
  return false;
}

function applyDamageToEnemy(state, e, {
  amount, knockbackX, knockbackY, hurtDuration, applyHitstop,
}) {
  if (!e.alive) return false;
  const wasAlive = e.alive;
  e.hp -= amount;
  e.vx = knockbackX;
  e.vy = knockbackY;
  e.state = 'hurt';
  e.hurtTimer = hurtDuration;
  if (e.hp <= 0) {
    e.hp = 0;
    e.alive = false;
    e.state = 'dead';
    e.deathStartTick = state.tick;
    if (wasAlive) awardSlimeKillXp(state);
  }
  if (applyHitstop) state.hitstop = HITSTOP_DURATION;
  return true;
}

function applyDamageToPlayer(state, p, {
  amount, knockbackX, knockbackY, hurtDuration, iframes, applyHitstop,
}) {
  if (p.hp <= 0) return false;
  if (p.iframeTimer > 0) return false;
  p.hp -= amount;
  if (p.hp < 0) p.hp = 0;
  p.vx = knockbackX;
  p.vy = knockbackY;
  p.state = 'hurt';
  p.hurtTimer = hurtDuration;
  p.iframeTimer = iframes;
  if (applyHitstop) state.hitstop = HITSTOP_DURATION;
  return true;
}

// --- Player melee vs enemies (hitbox + one damage each per swing) ---

export function getPlayerAttackHitbox(p) {
  return {
    x: p.facingRight ? p.x + p.w : p.x - ATTACK_RANGE_W,
    y: p.y + p.h / 2 - ATTACK_RANGE_H / 2,
    w: ATTACK_RANGE_W,
    h: ATTACK_RANGE_H,
  };
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Resolves one frame of player melee (call only while attack is active).
 */
export function processPlayerMeleeHits(state, p) {
  const i     = p.comboIndex - 1;
  const hitbox = getPlayerAttackHitbox(p);
  const m     = getPlayerDamageMultiplier(p);
  const dmg = m * (ATTACK_DAMAGE[i]    ?? ATTACK_DAMAGE[0]);
  const kb  = ATTACK_KNOCKBACK[i] ?? ATTACK_KNOCKBACK[0];
  const dir = p.facingRight ? 1 : -1;

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e._hitThisSwing) continue;
    if (!rectsOverlap(hitbox, e)) continue;

    applyDamage(state, {
      victim: 'enemy',
      ref: e,
      sourceId: 'player_melee',
      amount: dmg,
      knockbackX: dir * kb,
      knockbackY: ENEMY_ON_HIT_KB_Y,
      hurtDuration: SLIME_HURT_DUR,
      applyHitstop: true,
    });
    e._hitThisSwing = true;
  }
}

// --- Slime melee vs player (range check + pipeline) ---

function getSlimeMeleeHitbox(slime) {
  const frontX = slime.facingRight ? slime.x + slime.w : slime.x - SLIME_MELEE_REACH;
  return {
    x: frontX,
    y: slime.y - SLIME_MELEE_Y_PAD,
    w: SLIME_MELEE_REACH,
    h: slime.h + SLIME_MELEE_Y_PAD * 2,
  };
}

function sameCombatPlaneFeet(slime, player) {
  const sFeet = slime.y + slime.h;
  const pFeet = player.y + player.h;
  return Math.abs(sFeet - pFeet) <= SLIME_MELEE_FEET_Y_TOL;
}

export function processSlimeMeleeHit(state, slime, player, _distX) {
  if (player.iframeTimer > 0) return;
  if (player.hp <= 0) return;
  if (!sameCombatPlaneFeet(slime, player)) return;
  const hitbox = getSlimeMeleeHitbox(slime);
  if (!rectsOverlap(hitbox, player)) return;

  const dir = player.x > slime.x ? 1 : -1;
  applyDamage(state, {
    victim: 'player',
    ref: player,
    sourceId: 'slime_melee',
    amount: SLIME_ATTACK_DAMAGE,
    knockbackX: dir * SLIME_KNOCKBACK,
    knockbackY: SLIME_KNOCKUP,
    hurtDuration: PLAYER_HURT_DUR,
    iframes: PLAYER_HURT_IFRAMES,
    applyHitstop: true,
  });
}

// Clear per-swing flags (call once per tick, before player update)
export function clearHitFlags(state) {
  for (const e of state.enemies) e._hitThisSwing = false;
}
