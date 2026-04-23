// ============================================================
// Player + slime: sprite pipeline (animKeys + animClips + spriteConfig).
// Registry always provides a strip canvas; PNGs replace it when present.
// Fallback rect draw only if blit fails (e.g. missing source).
// ============================================================

import {
  COLOR_PLAYER, COLOR_PLAYER_ATK,
  COLOR_SLIME, COLOR_SLIME_HIT, COLOR_SLIME_TEL,
  COLOR_IFRAME,
  ATTACK_RANGE_W, ATTACK_RANGE_H,
} from '../config/Constants.js';
import { getPlayerAnimKey } from './animKeys.js';
import { PLAYER_SHEET, SLIME_SHEET } from './spriteConfig.js';
import { resolvePlayerTextureRect, resolveSlimeTextureRect, shouldDrawSlime } from './animClips.js';
import { getPlayerSheet, getSlimeSheet } from './spriteRegistry.js';
import { drawImageFrame } from './spriteDraw.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
export function drawPlayer(ctx, state) {
  const p   = state.player;
  const key = getPlayerAnimKey(p);
  const src = resolvePlayerTextureRect(p, state);
  const img = getPlayerSheet();
  const dw  = PLAYER_SHEET.dest.w;
  const dh  = PLAYER_SHEET.dest.h;
  // Center sheet on hitbox (bottom align)
  const drawX = p.x + (p.w - dw) * 0.5;
  const drawY = p.y + p.h - dh;

  if (p.iframeTimer > 0) {
    ctx.fillStyle = COLOR_IFRAME;
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  }

  const used = drawImageFrame(
    ctx, img, src.sx, src.sy, src.sw, src.sh,
    drawX, drawY, dw, dh, !p.facingRight,
  );
  if (!used) {
    drawPlayerPlaceholder(ctx, p, key);
  }

  if (p.attackActive) {
    drawPlayerAttackGizmos(ctx, p);
  }
  if (p.comboIndex > 0 && p.state === 'attack') {
    for (let i = 0; i < p.comboIndex; i++) {
      ctx.fillStyle = COLOR_PLAYER_ATK;
      ctx.beginPath();
      ctx.arc(p.x + 4 + i * 10, p.y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayerPlaceholder(ctx, p, _key) {
  let color = COLOR_PLAYER;
  if (p.state === 'hurt' || p.hp <= 0) color = '#ef9a9a';
  if (p.state === 'dodge') color = '#80deea';
  if (p.state === 'dead') color = '#555';
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = '#0d1117';
  const eyeX = p.facingRight ? p.x + p.w - 8 : p.x + 4;
  ctx.fillRect(eyeX, p.y + 10, 6, 6);
}

function drawPlayerAttackGizmos(ctx, p) {
  const hx = p.facingRight ? p.x + p.w : p.x - ATTACK_RANGE_W;
  const hy = p.y + p.h / 2 - ATTACK_RANGE_H / 2;
  ctx.fillStyle = COLOR_PLAYER_ATK;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(hx, hy, ATTACK_RANGE_W, ATTACK_RANGE_H);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLOR_PLAYER_ATK;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  const arcX = p.facingRight ? p.x + p.w : p.x;
  ctx.arc(arcX, p.y + p.h / 2, ATTACK_RANGE_W * 0.8, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
export function drawEnemies(ctx, state) {
  for (const e of state.enemies) {
    if (!shouldDrawSlime(e, state)) {
      continue;
    }
    if (e.state === 'telegraph' && e.alive) {
      ctx.fillStyle = COLOR_SLIME_TEL;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(state.tick * 0.12);
      ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLOR_SLIME_TEL;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', e.x + e.w / 2, e.y - 12);
    }
    const src  = resolveSlimeTextureRect(e, state);
    if (!src) {
      continue;
    }
    const img  = getSlimeSheet();
    const sDest = SLIME_SHEET.dest;
    const squashW = e.grounded || !e.alive ? e.w + 6 : e.w;
    const squashH = e.grounded || !e.alive ? e.h - 4 : e.h;
    const squashX = e.x - (squashW - e.w) / 2;
    const squashY = e.y + (e.h - squashH);
    const drawX   = squashX + (squashW - sDest.w) * 0.5;
    const drawY   = squashY + squashH - sDest.h;

    const used = drawImageFrame(
      ctx, img, src.sx, src.sy, src.sw, src.sh,
      drawX, drawY, sDest.w, sDest.h, !e.facingRight,
    );
    if (!used) {
      let color = COLOR_SLIME;
      if (e.state === 'hurt') {
        color = COLOR_SLIME_HIT;
      }
      if (e.state === 'chase') {
        color = '#81c784';
      }
      if (!e.alive) {
        color = '#2e3d2e';
      }
      ctx.fillStyle = color;
      ctx.fillRect(squashX, squashY, squashW, squashH);
      ctx.fillStyle = '#0d1117';
      const ew = 5, eh = 5;
      const eyeOffX = e.facingRight ? e.w - 10 : 4;
      ctx.fillRect(e.x + eyeOffX,      squashY + 6, ew, eh);
      ctx.fillRect(e.x + eyeOffX + 8,  squashY + 6, ew, eh);
    }
    if (e.alive) {
      drawEnemyHPBar(ctx, e);
    }
  }
}

function drawEnemyHPBar(ctx, e) {
  const bw = e.w + 8;
  const bh = 4;
  const bx = e.x - 4;
  const by = e.y - 12;
  const pct = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = pct > 0.5 ? '#43a047' : pct > 0.25 ? '#f9a825' : '#e53935';
  ctx.fillRect(bx, by, bw * pct, bh);
}
