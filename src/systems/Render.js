// ============================================================
// WAYFINDER — Render.js
// Reads GameState. Never mutates it.
//
// === Draw order & depth (see artConfig.DRAW) ===
//  0 — `drawScreenBase`: full-screen scrim; does not follow camera. Sets neutral base behind parallax.
//  1–3 — `drawParallaxStack` (from `../render/backgroundLayers.js`):
//        [1] **far** — `PARALLAX_LAYERS[0]`, slowest (smallest multX) → reads deepest;
//        [2] **mid** — [1], middle parallax; [3] **near** — [2], fastest (still < gameplay);
//        Each layer: world-space `fillRect(0,0,levelW,levelH)` + `translate(-cam*mult)`.
//        Alphas: `def.opacity` × `Constants.READABILITY_PARALLAX_OPACITY_MULT` (tune in Constants to mute bg)
//        Zone: `data/zones.js` `parallaxTuning` = extra desat/darken [far, mid, near].
//  4+ — `translate(-cam)` 1:1: platforms (rim, shade, outline, READABILITY_PLATFORM_GROUND_SHADOW), enemies, player
//
// **Player (entityRender.drawPlayer):** getPlayerAnimKey + PLAYER_ANIM. Loop = sim tick; one-shots
//   from the same walls as sim (see Constants: PLAYER_ATTACK_STEP_TOTAL_SEC, DODGE_DURATION,
//   PLAYER_HURT_DUR) in animClips. Gameplay FSM → clip: table in Constants.js by PLAYER_SHEET_PX.
//   p.state is always 'idle'|'run'|'jump'|'fall'|'attack'|'dodge'|'hurt'|'dead' — for 'attack', comboIndex
//   picks attack_1|2|3; 'dead' and hp≤0 use idle row until death art exists.
// **Slime (entityRender.drawEnemies):** SLIME_ANIM + SLIME_AI_TO_ANIM (table in Constants by SLIME_SHEET_PX).
//   6 clip keys: idle, move, telegraph, attack, hurt, death (death: !alive + deathStartTick, not an AI state).
//   Telegraph = padded amber warning (SLIME_TEL_*, READABILITY_TEL_*, COLOR_SLIME_TEL) + "!" for SLIME_TELEGRAPH_DUR
//   only — absent during chase/move/attack so wind-up is visually distinct from the bite.
//  (render `alpha` / sprite lerp: reserved, unused)
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_PLATFORM, COLOR_PLATFORM_RIM, COLOR_PLATFORM_SHADE,
  READABILITY_PLATFORM_OUTLINE,
  READABILITY_PLATFORM_GROUND_SHADOW,
} from '../config/Constants.js';
import { drawParallaxStack, drawScreenBase } from '../render/backgroundLayers.js';
import { drawPlayer, drawEnemies } from '../render/entityRender.js';

/** @type {HTMLImageElement | null | undefined} */
let _groundTile = undefined;

export function loadWorldTiles() {
  if (typeof Image === 'undefined') return;
  if (_groundTile !== undefined) return;
  const im = new Image();
  im.onload = () => { _groundTile = im; };
  im.onerror = () => { _groundTile = null; };
  im.src = 'assets/tiles/ground.png';
  _groundTile = null;
}

export function render(ctx, state, alpha) {
  const cam = state.camera;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // LAYER: screen-locked base (hides void when camera overscrolls)
  drawScreenBase(ctx, state);

  // LAYER: 3x world parallax (far / mid / near) — see artConfig.PARALLAX_LAYERS
  drawParallaxStack(ctx, state, cam);

  // LAYER: gameplay (full camera scroll)
  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  drawPlatforms(ctx, state);
  drawEnemies(ctx, state);
  drawPlayer(ctx, state);

  ctx.restore();
  void alpha;
}

function drawPlatforms(ctx, state) {
  const g = READABILITY_PLATFORM_GROUND_SHADOW;
  const tile = _groundTile;
  for (const p of state.platforms) {
    const tx = Math.round(p.x);
    const ty = Math.round(p.y);
    const tw = Math.round(p.w);
    const th = Math.round(p.h);
    if (tile) {
      const srcW = tile.naturalWidth || tile.width || 0;
      const srcH = tile.naturalHeight || tile.height || 0;
      if (srcW > 0 && srcH > 0) {
        // Tile fill by repeated 1:1 blits for pixel-crisp platforms.
        for (let yy = ty; yy < ty + th; yy += srcH) {
          const dh = Math.min(srcH, ty + th - yy);
          for (let xx = tx; xx < tx + tw; xx += srcW) {
            const dw = Math.min(srcW, tx + tw - xx);
            ctx.drawImage(tile, 0, 0, dw, dh, xx, yy, dw, dh);
          }
        }
      } else {
        ctx.fillStyle = COLOR_PLATFORM;
        ctx.fillRect(tx, ty, tw, th);
      }
    } else {
      ctx.fillStyle = COLOR_PLATFORM;
      ctx.fillRect(tx, ty, tw, th);
    }
    // Keep top and bottom cues for walkable read in combat.
    ctx.fillStyle = COLOR_PLATFORM_RIM;
    ctx.fillRect(tx, ty, tw, 2);
    ctx.fillStyle = COLOR_PLATFORM_SHADE;
    ctx.fillRect(tx, ty + th - 2, tw, 2);
    ctx.strokeStyle = READABILITY_PLATFORM_OUTLINE.color;
    ctx.lineWidth   = READABILITY_PLATFORM_OUTLINE.w;
    ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
    ctx.fillStyle = g.color;
    ctx.fillRect(
      tx + g.inset,
      ty + th,
      Math.max(0, tw - g.inset * 2),
      g.h,
    );
  }
}
