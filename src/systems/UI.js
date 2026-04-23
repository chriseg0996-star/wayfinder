// ============================================================
// WAYFINDER — UI.js
// Phase 1: HP bar + win/lose overlays + optional F3/Backquote debug.
// (Zone title, goal ribbon, XP/combo HUD → use debug overlay only for QA.)
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_HP_BG, COLOR_HP_BAR, COLOR_HP_FILL,
  COLOR_DEBUG_BG, COLOR_DEBUG_TEXT,
  UI_LOSE_TITLE, UI_LOSE_SUB, UI_WIN_TITLE,
  UI_WIN_SUB_NEXT, UI_WIN_SUB_FINALE,
  COLOR_OVERLAY_BG, COLOR_OVERLAY_TITLE, COLOR_OVERLAY_SUB,
} from '../config/Constants.js';
import { isLastZone } from '../data/zones.js';
import { getXpToNextForLevel } from '../systems/Progression.js';

export function renderUI(ctx, state, fps) {
  if (state.roundState !== 'playing') {
    drawRoundOverlay(ctx, state);
  }
  drawHPBar(ctx, state.player);
  if (state.debug) {
    drawDebug(ctx, state, fps);
  }
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
  const sub = won
    ? (isLastZone(state.currentZoneId) ? UI_WIN_SUB_FINALE : UI_WIN_SUB_NEXT)
    : UI_LOSE_SUB;
  ctx.fillText(sub, CANVAS_W * 0.5, CANVAS_H * 0.5 + 12);
}

function drawHPBar(ctx, p) {
  const bw = 200;
  const bh = 16;
  const bx = 16;
  const by = 16;
  const pct = Math.max(0, p.hp / p.maxHp);

  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

  ctx.fillStyle = COLOR_HP_BG;
  ctx.fillRect(bx, by, bw, bh);

  const fillColor = pct > 0.5 ? COLOR_HP_FILL
                  : pct > 0.25 ? '#f9a825'
                  : COLOR_HP_BAR;
  ctx.fillStyle = fillColor;
  ctx.fillRect(bx, by, bw * pct, bh);

  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HP  ${p.hp} / ${p.maxHp}`, bx + 6, by + 12);
}

const DEBUG_HINT = '[F3] or [`] toggle';

function drawDebug(ctx, state, fps) {
  const p   = state.player;
  const need = getXpToNextForLevel(p.level);
  const lines = [
    `FPS  ${fps}  TICK  ${state.tick}  RND  ${state.roundState}  Z  ${state.currentZoneId}`,
    `LV${p.level}  XP  ${p.xp.toFixed(0)}/${need}  S/V/A  ${p.stats.str}/${p.stats.vit}/${p.stats.agi}`,
    `P  ${p.state}  g ${p.grounded}  x,y  ${p.x.toFixed(0)} ${p.y.toFixed(0)}  v  ${p.vx.toFixed(0)} ${p.vy.toFixed(0)}`,
    `ifr ${p.iframeTimer.toFixed(2)}  coy ${p.coyoteTimer.toFixed(2)}  cmb ${p.comboIndex}  hstop ${state.hitstop.toFixed(2)}`,
    `cam  ${state.camera.x.toFixed(0)} ${state.camera.y.toFixed(0)}`,
  ];

  const lh  = 15;
  const pad = 8;
  const bw  = Math.min(560, CANVAS_W - 20);
  const bh  = lines.length * lh + pad * 2;
  const bx  = 12;
  const by  = CANVAS_H - bh - 8;

  ctx.fillStyle = COLOR_DEBUG_BG;
  ctx.fillRect(bx, by, bw, bh);

  ctx.fillStyle = COLOR_DEBUG_TEXT;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';

  lines.forEach((line, i) => {
    ctx.fillText(line, bx + pad, by + pad + 9 + i * lh);
  });

  ctx.fillStyle = '#6b7a8a';
  ctx.fillText(DEBUG_HINT, bx + pad, by + bh - 4);
}
