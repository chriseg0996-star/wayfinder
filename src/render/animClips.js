// ============================================================
// Resolves (sx,sy) within a sheet from gameplay + sim tick.
// — Loop: global tick, deterministic.
// — One-shot: normalised 0..1 from timers (attack, dodge, hurt) or
//   death from deathStartTick + tick.
// No gameplay side effects. Sheet layout: spriteConfig.js
// ============================================================

import {
  FIXED_DT,
  DODGE_DURATION,
  PLAYER_HURT_DUR,
  ATTACK_STARTUP, ATTACK_ACTIVE, ATTACK_RECOVERY,
  SLIME_ATTACK_DUR, SLIME_HURT_DUR,
  RANGED_TELEGRAPH_DUR, RANGED_SHOT_COOLDOWN,
  HEAVY_TELEGRAPH_DUR, HEAVY_CHARGE_DUR, HEAVY_RECOVER_DUR,
  spriteClipDurationOneShotSec, spriteOneShotFrameIndex,
} from '../config/Constants.js';
import { PLAYER_SHEET, SLIME_SHEET, ARCHER_SHEET, BRUTE_SHEET, animFrameIndex } from './spriteConfig.js';
import { getPlayerAnimKey, getSlimeAnimKey } from './animKeys.js';

/** Desyncs looping slimes (render-only; GameState `e._animPhase`). */
function slimeLoopTick(e, state) {
  return state.tick + (e._animPhase | 0);
}

function makeRect(spec, frameIndex) {
  const { frameW, frameH } = PLAYER_SHEET;
  return {
    sx: frameIndex * frameW,
    sy: spec.row * frameH,
    sw: frameW,
    sh: frameH,
  };
}

function makeSlimeRect(spec, frameIndex) {
  const { frameW, frameH } = SLIME_SHEET;
  return {
    sx: frameIndex * frameW,
    sy: spec.row * frameH,
    sw: frameW,
    sh: frameH,
  };
}

function makeArcherRect(spec, frameIndex) {
  const { frameW, frameH } = ARCHER_SHEET;
  return {
    sx: frameIndex * frameW,
    sy: spec.row * frameH,
    sw: frameW,
    sh: frameH,
  };
}

function makeBruteRect(spec, frameIndex) {
  const { frameW, frameH } = BRUTE_SHEET;
  return {
    sx: frameIndex * frameW,
    sy: spec.row * frameH,
    sw: frameW,
    sh: frameH,
  };
}

function playerAttackIndex(p) {
  const k   = getPlayerAnimKey(p);
  const spec = (k === 'attack_1' || k === 'attack_2' || k === 'attack_3')
    ? (PLAYER_SHEET.rows[k] ?? PLAYER_SHEET.rows.attack_1)
    : PLAYER_SHEET.rows.attack_1;
  const ci  = p.comboIndex - 1;
  const su  = ATTACK_STARTUP[ci]  ?? ATTACK_STARTUP[0];
  const act = ATTACK_ACTIVE[ci]  ?? ATTACK_ACTIVE[0];
  const re  = ATTACK_RECOVERY[ci] ?? ATTACK_RECOVERY[0];
  const tot = su + act + re;
  if (tot <= 0) return 0;
  const t  = 1 - p.attackTimer / tot;
  return spriteOneShotFrameIndex(t, spec.frames);
}

/**
 * @param {object} p - state.player
 * @param {object} state
 * @returns {{ sx: number, sy: number, sw: number, sh: number }}
 */
export function resolvePlayerTextureRect(p, state) {
  const k = getPlayerAnimKey(p);
  const rows = PLAYER_SHEET.rows;

  if (k === 'idle' || k === 'run') {
    const r = rows[k] ?? rows.idle;
    return makeRect(r, animFrameIndex(state.tick, r));
  }
  if (k === 'jump' || k === 'fall') {
    const r = rows[k] ?? rows.idle;
    return makeRect(r, animFrameIndex(state.tick, r));
  }
  if (k === 'attack_1' || k === 'attack_2' || k === 'attack_3') {
    const r = rows[k] ?? rows.attack_1;
    return makeRect(r, playerAttackIndex(p));
  }
  if (k === 'dodge') {
    const r  = rows.dodge;
    const t  = 1 - p.dodgeTimer / DODGE_DURATION;
    return makeRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  if (k === 'hurt') {
    const r  = rows.hurt;
    const t  = 1 - p.hurtTimer / PLAYER_HURT_DUR;
    return makeRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  return makeRect(rows.idle, animFrameIndex(state.tick, rows.idle));
}

/**
 * @param {object} e - slime
 * @param {object} state
 * @returns {{ sx: number, sy: number, sw: number, sh: number } | null}
 *          null = nothing to blit (caller hides corpse)
 */
export function resolveSlimeTextureRect(e, state) {
  if (!e.alive && (e.deathStartTick == null)) {
    return null;
  }
  if (!e.alive) {
    // Death is not an AI state; do not use getSlimeAnimKey (would also return 'death' when !alive)
    const dSpec   = SLIME_SHEET.rows.death;
    const dur     = spriteClipDurationOneShotSec(dSpec);
    const elapsed = (state.tick - e.deathStartTick) * FIXED_DT;
    if (elapsed >= dur) {
      return null;
    }
    const t = elapsed / dur;
    return makeSlimeRect(dSpec, spriteOneShotFrameIndex(t, dSpec.frames));
  }

  const k = getSlimeAnimKey(e);
  if (k === 'idle' || k === 'move' || k === 'telegraph') {
    const r = SLIME_SHEET.rows[k] ?? SLIME_SHEET.rows.idle;
    return makeSlimeRect(r, animFrameIndex(slimeLoopTick(e, state), r));
  }
  if (k === 'attack') {
    const r = SLIME_SHEET.rows.attack;
    const t = 1 - e.attackTimer / SLIME_ATTACK_DUR;
    return makeSlimeRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  if (k === 'hurt') {
    const r = SLIME_SHEET.rows.hurt;
    const t = 1 - e.hurtTimer / SLIME_HURT_DUR;
    return makeSlimeRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  return makeSlimeRect(
    SLIME_SHEET.rows.idle,
    animFrameIndex(slimeLoopTick(e, state), SLIME_SHEET.rows.idle),
  );
}

/**
 * @param {object} e
 * @param {object} state
 * @returns {boolean} whether the slime (including corpse) should be drawn
 */
export function shouldDrawSlime(e, state) {
  if (e.alive) return true;
  if (e.deathStartTick == null) return false;
  const dSpec = SLIME_SHEET.rows.death;
  const dur   = spriteClipDurationOneShotSec(dSpec);
  return (state.tick - e.deathStartTick) * FIXED_DT < dur;
}

/**
 * @param {object} e - ranged enemy
 * @param {object} state
 * @returns {{ sx: number, sy: number, sw: number, sh: number } | null}
 */
export function resolveRangedTextureRect(e, state) {
  const rows = ARCHER_SHEET.rows;
  if (!e.alive) {
    if (e.deathStartTick == null) return null;
    const dSpec = rows.death;
    const dur = spriteClipDurationOneShotSec(dSpec);
    const elapsed = (state.tick - e.deathStartTick) * FIXED_DT;
    if (elapsed >= dur) return null;
    const t = elapsed / dur;
    return makeArcherRect(dSpec, spriteOneShotFrameIndex(t, dSpec.frames));
  }
  if (e.state === 'hurt') {
    const r = rows.hurt;
    const total = 0.28;
    const t = 1 - (e.hurtTimer ?? 0) / total;
    return makeArcherRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  if (e.state === 'telegraph') {
    const r = rows.aim;
    const t = 1 - (e.telegraphTimer ?? 0) / RANGED_TELEGRAPH_DUR;
    return makeArcherRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  // Brief shoot clip right after telegraph resolves.
  if ((e.shootCooldown ?? 0) > (RANGED_SHOT_COOLDOWN - 0.12)) {
    const r = rows.shoot;
    const t = 1 - ((e.shootCooldown - (RANGED_SHOT_COOLDOWN - 0.12)) / 0.12);
    return makeArcherRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  if (e.state === 'kite') {
    const r = rows.move;
    return makeArcherRect(r, animFrameIndex(state.tick, r));
  }
  const r = rows.idle;
  return makeArcherRect(r, animFrameIndex(state.tick, r));
}

/**
 * @param {object} e - heavy enemy
 * @param {object} state
 * @returns {{ sx: number, sy: number, sw: number, sh: number } | null}
 */
export function resolveHeavyTextureRect(e, state) {
  const rows = BRUTE_SHEET.rows;
  if (!e.alive) {
    if (e.deathStartTick == null) return null;
    const dSpec = rows.death;
    const dur = spriteClipDurationOneShotSec(dSpec);
    const elapsed = (state.tick - e.deathStartTick) * FIXED_DT;
    if (elapsed >= dur) return null;
    const t = elapsed / dur;
    return makeBruteRect(dSpec, spriteOneShotFrameIndex(t, dSpec.frames));
  }
  if (e.state === 'hurt') {
    const r = rows.hurt;
    const t = 1 - (e.hurtTimer ?? 0) / 0.28;
    return makeBruteRect(r, spriteOneShotFrameIndex(t, r.frames));
  }
  if (e.state === 'telegraph') {
    const r = rows.attack;
    const t = 1 - (e.telegraphTimer ?? 0) / HEAVY_TELEGRAPH_DUR;
    const frac = Math.max(0, Math.min(1, t));
    return makeBruteRect(r, spriteOneShotFrameIndex(frac * 0.35, r.frames));
  }
  if (e.state === 'charge') {
    const r = rows.attack;
    const t = 1 - (e.chargeTimer ?? 0) / HEAVY_CHARGE_DUR;
    const frac = Math.max(0, Math.min(1, t));
    return makeBruteRect(r, Math.max(1, spriteOneShotFrameIndex(0.35 + frac * 0.5, r.frames)));
  }
  if (e.state === 'recover') {
    const r = rows.attack;
    const t = 1 - (e.recoverTimer ?? 0) / HEAVY_RECOVER_DUR;
    const frac = Math.max(0, Math.min(1, t));
    return makeBruteRect(r, Math.max(2, spriteOneShotFrameIndex(0.7 + frac * 0.3, r.frames)));
  }
  if (e.state === 'approach') {
    const r = rows.move;
    return makeBruteRect(r, animFrameIndex(state.tick, r));
  }
  const r = rows.idle;
  return makeBruteRect(r, animFrameIndex(state.tick, r));
}
