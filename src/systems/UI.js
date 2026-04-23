// ============================================================
// WAYFINDER — UI.js — Phase 1 “minimal HUD”
// — HP bar (always in play and on round end)
// — Win/lose + hint copy only when round is over (loop feedback, not extra systems)
// — Debug overlay: F3 (or `) toggles `state.debug` in Game; draw only when on (zero per-frame work when off)
// No XP, cooldown, or meta UI. See entityRender for in-world gizmos (separate from HUD).
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

export function renderUI(ctx, state, fps) {
  if (state.roundState !== 'playing') {
    drawRoundOverlay(ctx, state);
  }
  drawHPBar(ctx, state.player);
  if (state.debug) {
    drawDebugOverlay(ctx, state, fps);
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

const DEBUG_LH  = 12;
const DEBUG_PAD = 4;
const DEBUG_W   = 168;

/**
 * Bottom-left, 7 lines. Only when `state.debug` (no work when off).
 * FPS: Game keeps a light rolling frame-time average; overlay adds only 7 `fillText` + fill/stroke.
 */
function drawDebugOverlay(ctx, state, fps) {
  const p = state.player;
  const c = state.camera;
  const gnd  = p.grounded ? 1 : 0;
  const f1  = n => n.toFixed(1).padStart(7, ' ');

  const lines = [
    `fps ${String(fps).padStart(3, ' ')}`,
    `p.x ${f1(p.x)}  p.y ${f1(p.y)}`,
    `v.x ${f1(p.vx)}  v.y ${f1(p.vy)}`,
    `gnd ${gnd}`,
    `st  ${p.state}`,
    `cmb ${p.comboIndex}`,
    `c.x ${String(Math.round(c.x)).padStart(4, ' ')}  c.y ${String(Math.round(c.y)).padStart(4, ' ')}`,
  ];
  const nL = lines.length;
  const bh  = nL * DEBUG_LH + DEBUG_PAD * 2;
  const bx  = 8;
  const by  = CANVAS_H - bh - 8;

  ctx.fillStyle = COLOR_DEBUG_BG;
  ctx.fillRect(bx, by, DEBUG_W, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, DEBUG_W - 1, bh - 1);

  ctx.fillStyle    = COLOR_DEBUG_TEXT;
  ctx.font         = '10px ui-monospace, "Cascadia Mono", Consolas, monospace';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';

  let y = by + DEBUG_PAD;
  for (let i = 0; i < nL; i++) {
    ctx.fillText(lines[i], bx + DEBUG_PAD, y);
    y += DEBUG_LH;
  }
}
