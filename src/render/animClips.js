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
} from '../config/Constants.js';
import { PLAYER_SHEET, SLIME_SHEET, animFrameIndex } from './spriteConfig.js';
import { getPlayerAnimKey, getSlimeAnimKey } from './animKeys.js';

/**
 * t in [0,1] over the one-shot, maps to 0..frames-1
 * @param {number} t
 * @param {number} frames
 */
function oneShotNorm(t, frames) {
  if (frames < 1) return 0;
  const tc = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return Math.min(frames - 1, Math.max(0, Math.floor(tc * frames)));
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

function playerAttackIndex(p) {
  const ci  = p.comboIndex - 1;
  const su  = ATTACK_STARTUP[ci]  ?? ATTACK_STARTUP[0];
  const act = ATTACK_ACTIVE[ci]  ?? ATTACK_ACTIVE[0];
  const re  = ATTACK_RECOVERY[ci] ?? ATTACK_RECOVERY[0];
  const tot = su + act + re;
  if (tot <= 0) return 0;
  const t  = 1 - p.attackTimer / tot;
  const k  = p.comboIndex === 1 ? 'attack_1' : p.comboIndex === 2 ? 'attack_2' : 'attack_3';
  const spec  = PLAYER_SHEET.rows[k] ?? PLAYER_SHEET.rows.attack_1;
  return oneShotNorm(t, spec.frames);
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
    const r = rows[k];
    return makeRect(r, animFrameIndex(state.tick, r));
  }
  if (k === 'attack_1' || k === 'attack_2' || k === 'attack_3') {
    return makeRect(rows[k], playerAttackIndex(p));
  }
  if (k === 'dodge') {
    const r  = rows.dodge;
    const t  = 1 - p.dodgeTimer / DODGE_DURATION;
    return makeRect(r, oneShotNorm(t, r.frames));
  }
  if (k === 'hurt') {
    const r  = rows.hurt;
    const t  = 1 - p.hurtTimer / PLAYER_HURT_DUR;
    return makeRect(r, oneShotNorm(t, r.frames));
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
    const dSpec = SLIME_SHEET.rows.death;
    const dur   = dSpec.frames / dSpec.fps;
    const elapsed = (state.tick - e.deathStartTick) * FIXED_DT;
    if (elapsed >= dur) {
      return null;
    }
    const t = elapsed / dur;
    return makeSlimeRect(dSpec, oneShotNorm(t, dSpec.frames));
  }

  const k = getSlimeAnimKey(e);
  if (k === 'idle' || k === 'move' || k === 'telegraph') {
    const r = SLIME_SHEET.rows[k] ?? SLIME_SHEET.rows.idle;
    return makeSlimeRect(r, animFrameIndex(state.tick, r));
  }
  if (k === 'attack') {
    const r = SLIME_SHEET.rows.attack;
    const t = 1 - e.attackTimer / SLIME_ATTACK_DUR;
    return makeSlimeRect(r, oneShotNorm(t, r.frames));
  }
  if (k === 'hurt') {
    const r = SLIME_SHEET.rows.hurt;
    const t = 1 - e.hurtTimer / SLIME_HURT_DUR;
    return makeSlimeRect(r, oneShotNorm(t, r.frames));
  }
  return makeSlimeRect(SLIME_SHEET.rows.idle, animFrameIndex(state.tick, SLIME_SHEET.rows.idle));
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
  const dur   = dSpec.frames / dSpec.fps;
  return (state.tick - e.deathStartTick) * FIXED_DT < dur;
}
