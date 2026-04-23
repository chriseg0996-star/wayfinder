// ============================================================
// Sheet view used by animClips + entityRender. Row + playback
// numbers are owned by Constants (PLAYER_ANIM / SLIME_ANIM / *_SHEET_PX).
// ============================================================

import {
  PLAYER_W, PLAYER_H, SLIME_W, SLIME_H,
  PLAYER_RENDER_SCALE,
  PLAYER_SHEET_PX, SLIME_SHEET_PX,
  PLAYER_ANIM, SLIME_ANIM, spriteLoopFrameIndex,
} from '../config/Constants.js';

export const PLAYER_SHEET = {
  frameW: PLAYER_SHEET_PX.frameW,
  frameH: PLAYER_SHEET_PX.frameH,
  rows:   PLAYER_ANIM,
  // Render-only scale; world collision still uses PLAYER_W / PLAYER_H.
  dest:   { w: Math.round(PLAYER_W * PLAYER_RENDER_SCALE), h: Math.round(PLAYER_H * PLAYER_RENDER_SCALE) },
};

export const SLIME_SHEET = {
  frameW: SLIME_SHEET_PX.frameW,
  frameH: SLIME_SHEET_PX.frameH,
  rows:   SLIME_ANIM,
  dest:   { w: SLIME_W, h: SLIME_H },
};

/**
 * Minimum texture size (px) for a strip that matches `PLAYER_ANIM` / `SLIME_ANIM`.
 * Row `r` starts at y = r * frameH; frame `f` in that row at x = f * frameW (no inter-row padding).
 * Sheet may be larger; smaller fails validation on load (see spriteRegistry).
 * @param {{ frameW: number, frameH: number }} sheetPx
 * @param {Record<string, { row: number, frames: number }>} anim
 * @returns {{ w: number, h: number }}
 */
export function getMinSheetPixelSize(sheetPx, anim) {
  let maxW = 0;
  let maxRow = 0;
  for (const k of Object.keys(anim)) {
    const s = anim[k];
    maxW    = Math.max(maxW, s.frames * sheetPx.frameW);
    maxRow  = Math.max(maxRow, s.row);
  }
  return { w: maxW, h: (maxRow + 1) * sheetPx.frameH };
}

/** Authoritative min size for `assets/sprites/player.png` (see assets/sprites/README.md). */
export const PLAYER_SHEET_PIXEL_SIZE = getMinSheetPixelSize(PLAYER_SHEET_PX, PLAYER_ANIM);

/** Authoritative min size for `assets/sprites/slime.png`. */
export const SLIME_SHEET_PIXEL_SIZE = getMinSheetPixelSize(SLIME_SHEET_PX, SLIME_ANIM);

/**
 * Looping row frame index. Delegates to `spriteLoopFrameIndex` in Constants.
 * @param {number} tick
 * @param {import('../config/Constants').SpriteRow} spec
 */
export function animFrameIndex(tick, spec) {
  return spriteLoopFrameIndex(tick, spec);
}
