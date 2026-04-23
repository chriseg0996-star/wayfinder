// ============================================================
// Sheet layout: one horizontal strip per **anim row** (y = row * frameH).
// `animClips.js` maps gameplay → frame index; loop = tick + fps, one-shots
// from timers. Tweak `frames` / `fps` when art lands; frameW/ frameH = PNG.
// ============================================================

import { FIXED_DT, PLAYER_W, PLAYER_H, SLIME_W, SLIME_H } from '../config/Constants.js';

export const PLAYER_SHEET = {
  frameW: 32,
  frameH: 48,
  rows: {
    idle:     { row: 0, frames: 4, fps: 5 },
    run:      { row: 1, frames: 6, fps: 8 },
    jump:     { row: 2, frames: 3, fps: 4 },
    fall:     { row: 3, frames: 3, fps: 4 },
    attack_1: { row: 4, frames: 3, fps: 12 },
    attack_2: { row: 5, frames: 3, fps: 12 },
    attack_3: { row: 6, frames: 3, fps: 10 },
    dodge:    { row: 7, frames: 2, fps: 10 },
    hurt:     { row: 8, frames: 2, fps: 8 },
  },
  dest: { w: PLAYER_W, h: PLAYER_H },
};

export const SLIME_SHEET = {
  frameW: 32,
  frameH: 24,
  rows: {
    idle:      { row: 0, frames: 2, fps: 4 },
    move:      { row: 1, frames: 4, fps: 6 },
    telegraph: { row: 2, frames: 2, fps: 6 },
    attack:    { row: 3, frames: 3, fps: 8 },
    hurt:      { row: 4, frames: 2, fps: 6 },
    death:     { row: 5, frames: 4, fps: 6 },
  },
  dest: { w: SLIME_W, h: SLIME_H },
};

/**
 * @param {number} tick
 * @param {{ frames: number, fps: number }} spec
 */
export function animFrameIndex(tick, spec) {
  if (!spec || spec.frames < 1) {
    return 0;
  }
  const tSec = tick * FIXED_DT;
  const idx  = Math.floor(tSec * spec.fps) % spec.frames;
  return Math.max(0, Math.min(spec.frames - 1, idx));
}
