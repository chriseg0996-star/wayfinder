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
  spriteClipDurationOneShotSec, spriteOneShotFrameIndex,
} from '../config/Constants.js';
import { PLAYER_SHEET, SLIME_SHEET, animFrameIndex } from './spriteConfig.js';
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
