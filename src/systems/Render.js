// ============================================================
// WARDENFALL — Render.js
// Reads GameState. Never mutates it. Placeholder visuals only.
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_BG, COLOR_PLATFORM,
  COLOR_PLAYER, COLOR_PLAYER_ATK,
  COLOR_SLIME, COLOR_SLIME_HIT, COLOR_SLIME_TEL,
  COLOR_IFRAME,
  ATTACK_RANGE_W, ATTACK_RANGE_H,
} from '../config/Constants.js';

export function render(ctx, state, alpha) {
  const cam = state.camera;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  drawPlatforms(ctx, state);
  drawEnemies(ctx, state);
  drawPlayer(ctx, state);

  ctx.restore();
}

function drawPlatforms(ctx, state) {
  ctx.fillStyle = COLOR_PLATFORM;
  for (const p of state.platforms) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Top edge highlight
    ctx.fillStyle = '#4e6070';
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = COLOR_PLATFORM;
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;

  // I-frame ghost effect
  if (p.iframeTimer > 0) {
    ctx.fillStyle = COLOR_IFRAME;
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  }

  // Body color by state
  let color = COLOR_PLAYER;
  if (p.state === 'hurt')  color = '#ef9a9a';
  if (p.state === 'dodge') color = '#80deea';
  if (p.state === 'dead')  color = '#555';

  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  // Eye direction indicator
  ctx.fillStyle = '#0d1117';
  const eyeX = p.facingRight ? p.x + p.w - 8 : p.x + 4;
  ctx.fillRect(eyeX, p.y + 10, 6, 6);

  // Attack hitbox
  if (p.attackActive) {
    const hx = p.facingRight ? p.x + p.w : p.x - ATTACK_RANGE_W;
    const hy = p.y + (p.h / 2) - ATTACK_RANGE_H / 2;
    ctx.fillStyle = COLOR_PLAYER_ATK;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(hx, hy, ATTACK_RANGE_W, ATTACK_RANGE_H);
    ctx.globalAlpha = 1;

    // Slash arc hint
    ctx.strokeStyle = COLOR_PLAYER_ATK;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const arcX = p.facingRight ? p.x + p.w : p.x;
    ctx.arc(arcX, p.y + p.h / 2, ATTACK_RANGE_W * 0.8, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Combo indicator dots
  if (p.comboIndex > 0 && p.state === 'attack') {
    for (let i = 0; i < p.comboIndex; i++) {
      ctx.fillStyle = COLOR_PLAYER_ATK;
      ctx.beginPath();
      ctx.arc(p.x + 4 + i * 10, p.y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEnemies(ctx, state) {
  for (const e of state.enemies) {
    if (!e.alive) continue;

    // Telegraph warning
    if (e.state === 'telegraph') {
      ctx.fillStyle = COLOR_SLIME_TEL;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(Date.now() * 0.018);
      ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
      ctx.globalAlpha = 1;

      // Exclamation
      ctx.fillStyle = COLOR_SLIME_TEL;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', e.x + e.w / 2, e.y - 12);
    }

    // Body
    let color = COLOR_SLIME;
    if (e.state === 'hurt') color = COLOR_SLIME_HIT;
    if (e.state === 'chase') color = '#81c784';

    ctx.fillStyle = color;

    // Slime squash — slightly wider when on ground
    const squashW = e.grounded ? e.w + 6 : e.w;
    const squashH = e.grounded ? e.h - 4 : e.h;
    const squashX = e.x - (squashW - e.w) / 2;
    const squashY = e.y + (e.h - squashH);
    ctx.fillRect(squashX, squashY, squashW, squashH);

    // Eyes
    ctx.fillStyle = '#0d1117';
    const ew = 5, eh = 5;
    const eyeOffX = e.facingRight ? e.w - 10 : 4;
    ctx.fillRect(e.x + eyeOffX,      squashY + 6, ew, eh);
    ctx.fillRect(e.x + eyeOffX + 8,  squashY + 6, ew, eh);

    // HP bar above enemy
    drawEnemyHPBar(ctx, e);
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
