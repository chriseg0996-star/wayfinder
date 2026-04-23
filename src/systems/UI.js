// ============================================================
// WARDENFALL — UI.js
// Screen-space UI. HP bar + F3 debug overlay.
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_HP_BG, COLOR_HP_BAR, COLOR_HP_FILL,
  COLOR_DEBUG_BG, COLOR_DEBUG_TEXT,
} from '../config/Constants.js';

export function renderUI(ctx, state, fps) {
  drawHPBar(ctx, state.player);
  if (state.debug) drawDebug(ctx, state, fps);
}

function drawHPBar(ctx, p) {
  const bw = 200;
  const bh = 16;
  const bx = 16;
  const by = 16;
  const pct = Math.max(0, p.hp / p.maxHp);

  // Border
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

  // BG
  ctx.fillStyle = COLOR_HP_BG;
  ctx.fillRect(bx, by, bw, bh);

  // Fill
  const fillColor = pct > 0.5 ? COLOR_HP_FILL
                  : pct > 0.25 ? '#f9a825'
                  : COLOR_HP_BAR;
  ctx.fillStyle = fillColor;
  ctx.fillRect(bx, by, bw * pct, bh);

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HP  ${p.hp} / ${p.maxHp}`, bx + 6, by + 12);

  // Combo indicator
  if (p.comboIndex > 0) {
    ctx.fillStyle = '#fff176';
    ctx.font = '11px monospace';
    ctx.fillText(`COMBO ×${p.comboIndex}`, bx, by + bh + 16);
  }
}

function drawDebug(ctx, state, fps) {
  const p    = state.player;
  const lines = [
    `FPS       ${fps}`,
    `TICK      ${state.tick}`,
    `STATE     ${p.state}`,
    `GROUNDED  ${p.grounded}`,
    `POS       ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`,
    `VEL       ${p.vx.toFixed(1)}, ${p.vy.toFixed(1)}`,
    `COMBO     ${p.comboIndex}`,
    `IFRAME    ${p.iframeTimer.toFixed(2)}`,
    `COYOTE    ${p.coyoteTimer.toFixed(2)}`,
    `JUMPBUF   ${p.jumpBuffer.toFixed(2)}`,
    `HITSTOP   ${state.hitstop.toFixed(3)}`,
    `CAM       ${state.camera.x.toFixed(0)}, ${state.camera.y.toFixed(0)}`,
  ];

  const lh  = 16;
  const pad = 10;
  const bw  = 230;
  const bh  = lines.length * lh + pad * 2;
  const bx  = CANVAS_W - bw - 12;
  const by  = 12;

  ctx.fillStyle = COLOR_DEBUG_BG;
  ctx.fillRect(bx, by, bw, bh);

  ctx.fillStyle = COLOR_DEBUG_TEXT;
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';

  lines.forEach((line, i) => {
    ctx.fillText(line, bx + pad, by + pad + 11 + i * lh);
  });

  ctx.fillStyle = '#546e7a';
  ctx.font = '10px monospace';
  ctx.fillText('[F3] toggle debug', bx + pad, by + bh - 4);
}
