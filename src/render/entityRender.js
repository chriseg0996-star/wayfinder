// ============================================================
// Player + slime: sprite blits (animKeys → animClips; rows: Constants PLAYER_ANIM / SLIME_ANIM).
// Registry: optional PNGs — else procedural strip (spriteRegistry). Flip: drawImageFrame flipX.
// If blit fails: first cell of sheet (0,0) as sprite fallback, then simple rect.
// ============================================================

import {
  COLOR_PLAYER, COLOR_PLAYER_ATK,
  COLOR_SLIME, COLOR_SLIME_HIT, COLOR_SLIME_TEL,
  SLIME_TEL_PAD_PX, SLIME_TEL_PULSE, SLIME_TEL_SINE, SLIME_TEL_FONT,
  READABILITY_PLAYER_STROKE, READABILITY_PLAYER_SHADOW,
  READABILITY_SLIME_STROKE, READABILITY_SLIME_SHADOW,
  READABILITY_TEL_STROKE, READABILITY_TEL_INNER_DARK,
  COLOR_IFRAME,
  ATTACK_RANGE_W, ATTACK_RANGE_H,
  RANGED_SPRITE_OFFSET_X, RANGED_SPRITE_OFFSET_Y,
  HEAVY_SPRITE_OFFSET_X, HEAVY_SPRITE_OFFSET_Y,
} from '../config/Constants.js';
import { getPlayerAnimKey } from './animKeys.js';
import { PLAYER_SHEET, SLIME_SHEET, ARCHER_SHEET, BRUTE_SHEET } from './spriteConfig.js';
import { resolvePlayerTextureRect, resolveSlimeTextureRect, resolveRangedTextureRect, resolveHeavyTextureRect, shouldDrawSlime } from './animClips.js';
import { getPlayerSheet, getSlimeSheet, getArcherSheet, getBruteSheet } from './spriteRegistry.js';
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

  if (p.abilityGuardTimer > 0) {
    const t = Math.max(0, Math.min(1, p.abilityGuardTimer / 0.32));
    const r = Math.round(22 + (1 - t) * 22);
    ctx.save();
    ctx.globalAlpha = 0.35 + t * 0.35;
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.5, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (p.abilityDamageFxTimer > 0) {
    const t = Math.max(0, Math.min(1, p.abilityDamageFxTimer / 0.14));
    const w = 84;
    const h = 52;
    const hx = p.facingRight ? p.x + p.w : p.x - w;
    const hy = p.y + p.h * 0.5 - h * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.25 + t * 0.45;
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(hx, hy, w, h);
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx + 0.5, hy + 0.5, w - 1, h - 1);
    ctx.restore();
  }

  drawGroundShadow(
    ctx,
    p.x + p.w * 0.5,
    p.y + p.h + READABILITY_PLAYER_SHADOW.offsetY,
    p.w * READABILITY_PLAYER_SHADOW.halfWMult,
    READABILITY_PLAYER_SHADOW.ry,
    READABILITY_PLAYER_SHADOW.color,
  );

  const used = drawImageFrame(
    ctx, img, src.sx, src.sy, src.sw, src.sh,
    drawX, drawY, dw, dh, !p.facingRight,
  );
  if (!used) {
    drawPlayerSpriteFallback(ctx, p, key, drawX, drawY, dw, dh);
  } else {
    ctx.save();
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = READABILITY_PLAYER_STROKE.color;
    ctx.lineWidth   = READABILITY_PLAYER_STROKE.w;
    ctx.strokeRect(
      drawX - 0.5, drawY - 0.5, dw + 1, dh + 1,
    );
    ctx.restore();
  }

  if (state.debug && p.attackActive) {
    drawPlayerAttackGizmos(ctx, p);
  }
  if (state.debug && p.comboIndex > 0 && p.state === 'attack') {
    for (let i = 0; i < p.comboIndex; i++) {
      ctx.fillStyle = COLOR_PLAYER_ATK;
      ctx.beginPath();
      ctx.arc(p.x + 4 + i * 10, p.y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Blit first sheet cell; if that fails, old rect placeholder (no sheet).
 */
function drawPlayerSpriteFallback(ctx, p, _key, drawX, drawY, dw, dh) {
  const img = getPlayerSheet();
  const { frameW, frameH } = PLAYER_SHEET;
  if (img && drawImageFrame(ctx, img, 0, 0, frameW, frameH, drawX, drawY, dw, dh, !p.facingRight)) {
    ctx.save();
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = READABILITY_PLAYER_STROKE.color;
    ctx.lineWidth   = READABILITY_PLAYER_STROKE.w;
    ctx.strokeRect(drawX - 0.5, drawY - 0.5, dw + 1, dh + 1);
    ctx.restore();
    return;
  }
  let color = COLOR_PLAYER;
  if (p.state === 'hurt' || p.hp <= 0) color = '#ef9a9a';
  if (p.state === 'dodge') color = '#80deea';
  if (p.state === 'dead') color = '#555';
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = READABILITY_PLAYER_STROKE.color;
  ctx.lineWidth   = READABILITY_PLAYER_STROKE.w;
  ctx.strokeRect(p.x - 0.5, p.y - 0.5, p.w + 1, p.h + 1);
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
    if (e.type === 'projectile') {
      if (!e.alive) continue;
      drawProjectile(ctx, e);
      continue;
    }
    if (e.type === 'ranged') {
      if (!e.alive) continue;
      drawRangedEnemy(ctx, e, state);
      continue;
    }
    if (e.type === 'heavy') {
      if (!e.alive) continue;
      drawHeavyEnemy(ctx, e, state);
      continue;
    }
    if (!shouldDrawSlime(e, state)) {
      continue;
    }
    if (e.state === 'telegraph' && e.alive) {
      const pad  = SLIME_TEL_PAD_PX;
      const x0   = e.x - pad;
      const y0   = e.y - pad;
      const wBox = e.w + pad * 2;
      const hBox = e.h + pad * 2;
      const pulse = SLIME_TEL_PULSE.min + SLIME_TEL_PULSE.range * Math.sin(
        state.tick * SLIME_TEL_SINE,
      );
      ctx.save();
      ctx.fillStyle  = READABILITY_TEL_INNER_DARK;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x0, y0, wBox, hBox);
      ctx.globalAlpha = 1;
      ctx.fillStyle   = COLOR_SLIME_TEL;
      ctx.globalAlpha = pulse;
      ctx.fillRect(x0, y0, wBox, hBox);
      ctx.globalAlpha = 1;
      ctx.lineWidth   = READABILITY_TEL_STROKE.w;
      ctx.strokeStyle = READABILITY_TEL_STROKE.color;
      ctx.strokeRect(x0 - 0.5, y0 - 0.5, wBox + 1, hBox + 1);
      ctx.restore();
      ctx.fillStyle     = COLOR_SLIME_TEL;
      ctx.font          = SLIME_TEL_FONT;
      ctx.textAlign     = 'center';
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
    const footY   = e.y + e.h + READABILITY_SLIME_SHADOW.offsetY;
    const sRadX   = Math.max(6, e.w * READABILITY_SLIME_SHADOW.halfWMult);
    drawGroundShadow(
      ctx, e.x + e.w * 0.5, footY, sRadX, READABILITY_SLIME_SHADOW.ry,
      READABILITY_SLIME_SHADOW.color,
    );

    const used = drawImageFrame(
      ctx, img, src.sx, src.sy, src.sw, src.sh,
      drawX, drawY, sDest.w, sDest.h, !e.facingRight,
    );
    if (!used) {
      const fW = SLIME_SHEET.frameW;
      const fH = SLIME_SHEET.frameH;
      if (img && drawImageFrame(ctx, img, 0, 0, fW, fH, drawX, drawY, sDest.w, sDest.h, !e.facingRight)) {
        ctx.save();
        ctx.lineJoin     = 'round';
        ctx.strokeStyle  = READABILITY_SLIME_STROKE.color;
        ctx.lineWidth    = READABILITY_SLIME_STROKE.w;
        ctx.strokeRect(drawX - 0.5, drawY - 0.5, sDest.w + 1, sDest.h + 1);
        ctx.restore();
      } else {
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
        ctx.strokeStyle = READABILITY_SLIME_STROKE.color;
        ctx.lineWidth   = READABILITY_SLIME_STROKE.w;
        ctx.strokeRect(squashX - 0.5, squashY - 0.5, squashW + 1, squashH + 1);
      }
    } else {
      ctx.save();
      ctx.lineJoin     = 'round';
      ctx.strokeStyle  = READABILITY_SLIME_STROKE.color;
      ctx.lineWidth    = READABILITY_SLIME_STROKE.w;
      ctx.strokeRect(drawX - 0.5, drawY - 0.5, sDest.w + 1, sDest.h + 1);
      ctx.restore();
    }
    if (e.alive) {
      drawEnemyHPBar(ctx, e);
    }
  }
}

function drawRangedEnemy(ctx, e, state) {
  const src = resolveRangedTextureRect(e, state);
  const img = getArcherSheet();
  const dw = ARCHER_SHEET.dest.w;
  const dh = ARCHER_SHEET.dest.h;
  const drawX = e.x + (e.w - dw) * 0.5 + RANGED_SPRITE_OFFSET_X;
  const drawY = e.y + e.h - dh + RANGED_SPRITE_OFFSET_Y;
  drawGroundShadow(ctx, e.x + e.w * 0.5, e.y + e.h + 2, e.w * 0.48, 4, 'rgba(0,0,0,0.45)');
  if (src && drawImageFrame(ctx, img, src.sx, src.sy, src.sw, src.sh, drawX, drawY, dw, dh, !e.facingRight)) {
    ctx.save();
    ctx.strokeStyle = 'rgba(8,10,16,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX - 0.5, drawY - 0.5, dw + 1, dh + 1);
    ctx.restore();
    if (e.alive) drawEnemyHPBar(ctx, e);
    return;
  }
  const body = e.state === 'telegraph' ? '#ffd166' : e.state === 'hurt' ? '#ef9a9a' : '#b39ddb';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(e.x + e.w * 0.5, e.y + e.h + 2, e.w * 0.48, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = 'rgba(8,10,16,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 0.5, e.y - 0.5, e.w + 1, e.h + 1);
  const eyeX = e.facingRight ? e.x + e.w - 9 : e.x + 3;
  ctx.fillStyle = '#101318';
  ctx.fillRect(eyeX, e.y + 8, 6, 5);
  if (e.alive) drawEnemyHPBar(ctx, e);
}

function drawProjectile(ctx, e) {
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 1;
  ctx.strokeRect(e.x + 0.5, e.y + 0.5, e.w - 1, e.h - 1);
}

function drawHeavyEnemy(ctx, e, state) {
  const src = resolveHeavyTextureRect(e, state);
  const img = getBruteSheet();
  const dw = BRUTE_SHEET.dest.w;
  const dh = BRUTE_SHEET.dest.h;
  const drawX = e.x + (e.w - dw) * 0.5 + HEAVY_SPRITE_OFFSET_X;
  const drawY = e.y + e.h - dh + HEAVY_SPRITE_OFFSET_Y;
  drawGroundShadow(ctx, e.x + e.w * 0.5, e.y + e.h + 2, e.w * 0.52, 5, 'rgba(0,0,0,0.5)');
  if (src && drawImageFrame(ctx, img, src.sx, src.sy, src.sw, src.sh, drawX, drawY, dw, dh, !e.facingRight)) {
    ctx.save();
    ctx.strokeStyle = 'rgba(16,10,10,0.95)';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX - 0.5, drawY - 0.5, dw + 1, dh + 1);
    ctx.restore();
    drawEnemyHPBar(ctx, e);
    return;
  }
  const body = e.state === 'telegraph'
    ? '#ffb74d'
    : e.state === 'charge'
      ? '#ef5350'
      : e.state === 'recover'
        ? '#8d6e63'
        : e.state === 'hurt'
          ? '#ef9a9a'
          : '#a1887f';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(e.x + e.w * 0.5, e.y + e.h + 2, e.w * 0.52, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = 'rgba(16,10,10,0.95)';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 0.5, e.y - 0.5, e.w + 1, e.h + 1);

  // Simple "horned helm" silhouette for quick archetype readability.
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(e.x + 6, e.y - 6, e.w - 12, 6);
  ctx.fillRect(e.x + 2, e.y - 4, 4, 4);
  ctx.fillRect(e.x + e.w - 6, e.y - 4, 4, 4);

  const eyeX = e.facingRight ? e.x + e.w - 11 : e.x + 4;
  ctx.fillStyle = '#101318';
  ctx.fillRect(eyeX, e.y + 12, 7, 6);

  if (e.state === 'telegraph') {
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x - 5, e.y - 5, e.w + 10, e.h + 10);
  }
  drawEnemyHPBar(ctx, e);
}

/**
 * Soft oval on the “ground” under a character (world space).
 * @param {number} cx - center x
 * @param {number} y  - center y of ellipse
 */
function drawGroundShadow(ctx, cx, y, halfW, ry, color) {
  ctx.save();
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.ellipse(cx, y, Math.max(2, halfW), ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemyHPBar(ctx, e) {
  const bw = 40;
  const bh = 4;
  const bx = e.x + e.w * 0.5 - bw * 0.5;
  const by = e.y - 12;
  const pct = Math.max(0, e.hp / e.maxHp);
  ctx.save();
  ctx.globalAlpha = 0.40;
  ctx.fillStyle = '#000000';
  ctx.fillRect(bx, by, bw, bh);
  ctx.globalAlpha = 0.90;
  ctx.fillStyle = pct > 0.5 ? '#43a047' : pct > 0.25 ? '#f9a825' : '#e53935';
  ctx.fillRect(bx, by, bw * pct, bh);
  ctx.restore();
}
