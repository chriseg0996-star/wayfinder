// ============================================================
// WAYFINDER — UI.js
// Screen-space UI. HP bar + F3 debug overlay.
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_HP_BG, COLOR_HP_BAR, COLOR_HP_FILL,
  COLOR_DEBUG_BG, COLOR_DEBUG_TEXT,
  UI_GOAL_LINE, UI_LOSE_TITLE, UI_LOSE_SUB, UI_WIN_TITLE, UI_WIN_SUB,
  COLOR_OVERLAY_BG, COLOR_OVERLAY_TITLE, COLOR_OVERLAY_SUB,
} from '../config/Constants.js';

export function renderUI(ctx, state, fps) {
  if (state.roundState !== 'playing') {
    drawRoundOverlay(ctx, state);
  }
  drawHPBar(ctx, state.player);
  if (state.roundState === 'playing') {
    drawGoalLine(ctx);
  }
  if (state.debug) drawDebug(ctx, state, fps);
}

function drawGoalLine(ctx) {
  ctx.fillStyle = 'rgba(236, 239, 241, 0.55)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(UI_GOAL_LINE, CANVAS_W * 0.5, CANVAS_H - 12);
}

function drawRoundOverlay(ctx, state) {
  ctx.fillStyle = COLOR_OVERLAY_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const won = state.roundState === 'win';
  ctx.fillStyle = COLOR_OVERLAY_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const title = won ? UI_WIN_TITLE : UI_LOSE_TITLE;
  ctx.fillText(title, CANVAS_W * 0.5, CANVAS_H * 0.5 - 16);

  ctx.fillStyle = COLOR_OVERLAY_SUB;
  ctx.font = '15px monospace';
  const sub = won ? UI_WIN_SUB : UI_LOSE_SUB;
  ctx.fillText(sub, CANVAS_W * 0.5, CANVAS_H * 0.5 + 12);
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
    `ROUND     ${state.roundState}`,
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
  ctx.fillText('[F3] or [`] toggle debug', bx + pad, by + bh - 4);
}
