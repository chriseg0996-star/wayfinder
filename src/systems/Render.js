// ============================================================
// WAYFINDER — Render.js
// Reads GameState. Never mutates it.
//
// Draw order (see docs/STYLE_BIBLE.md, artConfig.DRAW):
//  0 — screen base (desaturated, dark)
//  1–3 — parallax: far, mid, near (gradients from zone bg + state.parallaxTuning)
//  4+ — world @ cam 1:1 — platforms, entities, (FX later)
//  alpha — reserved for sprite sub-frame lerp; not used yet
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_PLATFORM, COLOR_PLATFORM_RIM, COLOR_PLATFORM_SHADE,
} from '../config/Constants.js';
import { drawParallaxStack, drawScreenBase } from '../render/backgroundLayers.js';
import { drawPlayer, drawEnemies } from '../render/entityRender.js';

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
  for (const p of state.platforms) {
    ctx.fillStyle = COLOR_PLATFORM;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = COLOR_PLATFORM_RIM;
    ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.fillStyle = COLOR_PLATFORM_SHADE;
    ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
  }
}
