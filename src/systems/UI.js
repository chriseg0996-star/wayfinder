// ============================================================
// WAYFINDER — UI.js
// Light MMO Hybrid baseline HUD (primitive visuals, no external assets).
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_HP_BG, COLOR_HP_BAR, COLOR_HP_FILL,
  COLOR_DEBUG_BG, COLOR_DEBUG_TEXT,
  UI_LOSE_TITLE, UI_LOSE_SUB, UI_WIN_TITLE,
  UI_WIN_SUB_NEXT, UI_WIN_SUB_FINALE,
  COLOR_OVERLAY_BG, COLOR_OVERLAY_TITLE, COLOR_OVERLAY_SUB,
  ABILITY_MOVE_CD, ABILITY_DAMAGE_CD, ABILITY_GUARD_CD,
} from '../config/Constants.js';
import { isLastZone } from '../data/zones.js';

const PANEL_KEYS = {
  inventory: 'I',
  character: 'C',
  map: 'M',
  settings: 'ESC',
};

const DEBUG_LH  = 12;
const DEBUG_PAD = 4;
const DEBUG_W   = 168;

const UI_THEME = {
  outer: 'rgba(8,12,18,0.72)',
  borderDark: 'rgba(14,18,24,0.72)',
  borderMid: 'rgba(84,66,40,0.55)',
  borderLight: 'rgba(214,171,101,0.85)',
  headerTop: '#4f3c23',
  headerBot: '#2c2216',
  title: '#f6d38a',
  label: '#a9b4c2',
  value: '#eef4ff',
  shadow: 'rgba(0,0,0,0.28)',
  slotBase: '#151b24',
  slotInner: '#243142',
};

function ensureUIState(state) {
  if (!state._ui) {
    state._ui = {
      openPanel: null,
      recentCombatTimer: 2,
      lowHpPulse: 0,
    };
  }
  return state._ui;
}

function togglePanel(state, panel) {
  const ui = ensureUIState(state);
  ui.openPanel = ui.openPanel === panel ? null : panel;
}

export function updateUIState(state, input) {
  const ui = ensureUIState(state);
  if (input.inventoryPressed) togglePanel(state, 'inventory');
  if (input.characterPressed) togglePanel(state, 'character');
  if (input.mapPressed) togglePanel(state, 'map');
  if (input.settingsPressed) {
    ui.openPanel = ui.openPanel ? null : 'settings';
  }

  const inCombat = state.player.state === 'attack' || state.player.state === 'hurt' || state.player.state === 'dodge'
    || state.enemies.some(e => e.alive && (e.type === 'projectile' || e.state === 'telegraph' || e.state === 'attack' || e.state === 'charge'));
  if (inCombat) ui.recentCombatTimer = 2;
  else ui.recentCombatTimer = Math.max(0, ui.recentCombatTimer - 1 / 60);
  ui.lowHpPulse += 1 / 60;
}

export function renderUI(ctx, state, fps) {
  const ui = ensureUIState(state);
  const cw = ctx.canvas?.width || CANVAS_W;
  const ch = ctx.canvas?.height || CANVAS_H;
  const small = cw < 900 || ch < 520;
  const scale = small ? 0.9 : 1;
  const minimized = ui.recentCombatTimer <= 0 && !ui.openPanel && state.roundState === 'playing';

  drawBottomSystemStrip(ctx, { w: cw, h: ch, s: scale });
  drawVitalsPanel(ctx, state, { x: 12 * scale, y: 10 * scale, s: scale, minimized });
  drawSkillBar(ctx, state, { x: cw * 0.5, y: ch - (small ? 62 : 76), s: scale });
  drawObjectiveTracker(ctx, state, { x: cw - (small ? 272 : 320), y: 12 * scale, w: small ? 258 : 304, s: scale, minimized });
  drawQuickItem(ctx, state, { x: cw * 0.5 + 184 * scale, y: ch - (small ? 58 : 72), s: scale, minimized });
  if (ui.openPanel) drawOnDemandPanels(ctx, state, ui.openPanel, { w: cw, h: ch, s: scale });

  if (state.roundState !== 'playing') drawRoundOverlay(ctx, state, cw, ch);
  if (state.debug) drawDebugOverlay(ctx, state, fps, cw, ch);
}

function drawPanelChrome(ctx, x, y, w, h, title = null) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(22,28,38,0.78)');
  grad.addColorStop(1, 'rgba(10,14,20,0.66)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Outer subtle glow
  ctx.shadowColor = 'rgba(215,170,95,0.22)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(215,170,95,0.52)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.shadowBlur = 0;

  // Thin gold frame hierarchy
  ctx.strokeStyle = UI_THEME.borderMid;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.strokeStyle = UI_THEME.borderLight;
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);

  // Inner shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(x + 4, y + h - 9, w - 8, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(x + 4, y + 4, w - 8, 4);

  if (title) {
    const hh = 14;
    const hGrad = ctx.createLinearGradient(x, y, x, y + hh);
    hGrad.addColorStop(0, 'rgba(77,58,34,0.74)');
    hGrad.addColorStop(1, 'rgba(38,29,20,0.62)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(x + 5, y + 5, w - 10, hh);
    ctx.strokeStyle = 'rgba(212,169,101,0.46)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5.5, y + 5.5, w - 11, hh - 1);
    ctx.fillStyle = UI_THEME.title;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 15);
  }
  ctx.restore();
}

function drawCorner(ctx, x, y, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + dy);
  ctx.stroke();
}

function drawBottomSystemStrip(ctx, vp) {
  const { w, h, s } = vp;
  const stripH = 92 * s;
  const y = h - stripH;
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, 'rgba(8,12,16,0.38)');
  g.addColorStop(1, 'rgba(8,10,14,0.68)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, stripH);
  ctx.strokeStyle = 'rgba(214,171,101,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(w, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawVitalsPanel(ctx, state, opts) {
  const p = state.player;
  const { x, y, s, minimized } = opts;
  const w = minimized ? 212 * s : 278 * s;
  const h = minimized ? 58 * s : 98 * s;
  const hpPct = Math.max(0, p.hp / p.maxHp);
  const lowHp = hpPct <= 0.25;
  const pulse = lowHp ? (0.45 + 0.35 * Math.sin(state._ui.lowHpPulse * 12)) : 0;

  drawPanelChrome(ctx, x, y, w, h, null);

  // Portrait placeholder
  const px = x + 12 * s;
  const py = y + 30 * s;
  const ps = 32 * s;
  ctx.save();
  ctx.fillStyle = '#1c2736';
  ctx.fillRect(px, py, ps, ps);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, ps - 1, ps - 1);
  ctx.fillStyle = UI_THEME.value;
  ctx.font = `${Math.round(12 * s)}px monospace`;
  ctx.fillText('P', px + ps * 0.4, py + ps * 0.7);
  const badgeW = 16 * s;
  const badgeH = 14 * s;
  ctx.fillStyle = '#111';
  ctx.fillRect(px + ps - badgeW - 2 * s, py + ps - badgeH - 2 * s, badgeW, badgeH);
  ctx.strokeStyle = UI_THEME.borderLight;
  ctx.strokeRect(px + ps - badgeW - 2 * s + 0.5, py + ps - badgeH - 2 * s + 0.5, badgeW - 1, badgeH - 1);
  ctx.fillStyle = UI_THEME.title;
  ctx.font = `${Math.round(9 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(String(p.level ?? 1), px + ps - badgeW * 0.5 - 2 * s, py + ps - 4 * s);
  ctx.restore();

  const bx = px + ps + 10 * s;
  const by = y + 18 * s;
  const bw = w - (bx - x) - 10 * s;
  const bh = 12 * s;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR_HP_BG;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = hpPct > 0.5 ? COLOR_HP_FILL : hpPct > 0.25 ? '#f9a825' : COLOR_HP_BAR;
  ctx.fillRect(bx, by, bw * hpPct, bh);
  // Subtle HP glow
  ctx.shadowColor = 'rgba(255,92,92,0.35)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(255,170,170,0.45)';
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.shadowBlur = 0;
  ctx.fillStyle = UI_THEME.value;
  ctx.font = `bold ${Math.round(11 * s)}px monospace`;
  ctx.fillText(`${p.hp}/${p.maxHp}`, bx + 4 * s, by + 10 * s);

  const resource = p.resource ?? p.mp ?? 0; // TODO: bind real resource field if introduced.
  const maxResource = p.maxResource ?? p.maxMp ?? 0; // TODO hook.
  if (!minimized) {
    const rBy = by + 17 * s;
    ctx.fillStyle = '#1f2a34';
    ctx.fillRect(bx, rBy, bw, bh);
    const rPct = maxResource > 0 ? Math.max(0, Math.min(1, resource / maxResource)) : 1;
    // Less saturated secondary resource
    ctx.fillStyle = '#4e7ca3';
    ctx.fillRect(bx, rBy, bw * rPct, bh);
    ctx.fillStyle = UI_THEME.value;
    ctx.font = `${Math.round(10 * s)}px monospace`;
    const rText = maxResource > 0 ? `${resource}/${maxResource}` : 'TODO';
    ctx.fillText(rText, bx + 4 * s, rBy + 10 * s);
  }
  ctx.fillStyle = UI_THEME.title;
  ctx.font = `bold ${Math.round(10 * s)}px monospace`;
  ctx.fillText(`LV ${p.level ?? 1}`, bx, y + h - 10 * s);

  if (lowHp) {
    // HP pulse on bar
    ctx.fillStyle = `rgba(255,82,82,${0.2 + pulse * 0.45})`;
    ctx.fillRect(bx, by, bw, bh);
    drawRedVignette(ctx, 0.22 + pulse * 0.22);
  }
  ctx.restore();
}

function drawSkillBar(ctx, state, opts) {
  const p = state.player;
  const { x, y, s } = opts;
  const slots = [
    { key: '1', name: 'Dash', cd: Math.max(0, p.abilityMoveCd ?? 0), maxCd: ABILITY_MOVE_CD, color: '#42a5f5' },
    { key: '2', name: 'Burst', cd: Math.max(0, p.abilityDamageCd ?? 0), maxCd: ABILITY_DAMAGE_CD, color: '#ff7043' },
    { key: '3', name: 'Guard', cd: Math.max(0, p.abilityGuardCd ?? 0), maxCd: ABILITY_GUARD_CD, color: '#66bb6a' },
    { key: '4', name: 'Skill4', cd: 0, maxCd: 1, color: '#ab47bc' }, // TODO hook
    { key: 'Q', name: 'SkillQ', cd: 0, maxCd: 1, color: '#8d6e63' }, // TODO hook
  ];
  const size = 44 * s;
  const gap = 8 * s;
  const totalW = slots.length * size + (slots.length - 1) * gap;
  const x0 = x - totalW * 0.5;

  const resource = p.resource ?? p.mp ?? 0; // TODO hook
  const maxResource = p.maxResource ?? p.maxMp ?? 0; // TODO hook
  const noResource = maxResource > 0 && resource <= 0;

  drawPanelChrome(ctx, x0 - 14 * s, y - 10 * s, totalW + 28 * s, size + 28 * s, null);
  ctx.save();
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const sx = x0 + i * (size + gap);
    const sy = y;
    // Framed slot
    ctx.fillStyle = UI_THEME.slotBase;
    ctx.fillRect(sx, sy, size, size);
    ctx.strokeStyle = UI_THEME.borderMid;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
    const isReady = slot.cd <= 0.001;
    const pulse = 0.45 + 0.35 * Math.sin((state._ui?.lowHpPulse ?? 0) * 7 + i);
    ctx.strokeStyle = isReady ? `rgba(214,171,101,${0.52 + pulse * 0.35})` : UI_THEME.borderLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 3.5, sy + 3.5, size - 7, size - 7);
    ctx.fillStyle = UI_THEME.slotInner;
    ctx.fillRect(sx + 5 * s, sy + 5 * s, size - 10 * s, size - 10 * s);
    // Inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(sx + 5 * s, sy + size - 11 * s, size - 10 * s, 6 * s);
    ctx.fillStyle = slot.color;
    ctx.globalAlpha = noResource && i > 2 ? 0.35 : 0.9;
    ctx.fillRect(sx + 8 * s, sy + 8 * s, size - 16 * s, size - 16 * s);
    ctx.globalAlpha = 1;

    if (slot.cd > 0) {
      const pct = Math.max(0, Math.min(1, slot.cd / slot.maxCd));
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      // Fill from bottom
      const hFill = size * pct;
      ctx.fillRect(sx, sy + (size - hFill), size, hFill);
      ctx.fillStyle = '#fff8e1';
      ctx.font = `bold ${Math.round(16 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(slot.cd.toFixed(1), sx + size * 0.5, sy + size * 0.60);
    }

    ctx.fillStyle = '#111';
    ctx.fillRect(sx + size * 0.34, sy + size - 12 * s, size * 0.32, 11 * s);
    ctx.strokeStyle = UI_THEME.borderLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + size * 0.34 + 0.5, sy + size - 12 * s + 0.5, size * 0.32 - 1, 10 * s);
    ctx.fillStyle = UI_THEME.value;
    ctx.font = `${Math.round(9 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(slot.key, sx + size * 0.5, sy + size - 3 * s);
  }
  ctx.restore();
}

function drawObjectiveTracker(ctx, state, opts) {
  const { x, y, w, s, minimized } = opts;
  if (minimized) return;
  const nonProj = state.enemies.filter(e => e.type !== 'projectile');
  const total = nonProj.length;
  const alive = nonProj.filter(e => e.alive).length;
  const done = total - alive;
  // TODO: replace with state.objectives.active when objective system is available.
  const title = `${state.currentZoneId.toUpperCase()}`;
  const sub = `Clear enemies ${done}/${total}`;

  drawPanelChrome(ctx, x, y, w, 48 * s, null);
  ctx.save();
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = UI_THEME.title;
  ctx.font = `bold ${Math.round(10 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 10 * s, y + 18 * s);
  ctx.fillStyle = UI_THEME.value;
  ctx.font = `${Math.round(9 * s)}px monospace`;
  ctx.fillText(sub, x + 10 * s, y + 34 * s);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawQuickItem(ctx, state, opts) {
  const { x, y, s, minimized } = opts;
  if (minimized) return;
  const quick = state.player.quickItem ?? null; // TODO: bind inventory quickslot when inventory is wired.
  if (!quick) return;
  const size = 36 * s;
  drawPanelChrome(ctx, x - 6 * s, y - 20 * s, size + 12 * s, size + 26 * s, 'ITEM');
  ctx.save();
  ctx.fillStyle = UI_THEME.slotBase;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = UI_THEME.borderLight;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(x + 6 * s, y + 6 * s, size - 12 * s, size - 12 * s);
  ctx.fillStyle = '#111';
  ctx.font = `${Math.round(8 * s)}px monospace`;
  ctx.fillText('R', x + size * 0.5, y + size - 4 * s);
  ctx.restore();
}

function drawOnDemandPanels(ctx, state, panel, vp) {
  const { w, h, s } = vp;
  const pw = Math.min(290 * s, w - 24 * s);
  const ph = Math.min(200 * s, h - 90 * s);
  const y = (h - ph) * 0.58;
  const xLeft = w * 0.5 - pw - 8 * s;
  const xRight = w * 0.5 + 8 * s;
  if (panel === 'inventory' || panel === 'character') {
    drawSecondaryWindow(ctx, state, 'inventory', xLeft, y, pw, ph, s);
    drawSecondaryWindow(ctx, state, 'character', xRight, y, pw, ph, s);
    return;
  }
  drawSecondaryWindow(ctx, state, panel, w * 0.5 - pw * 0.5, y, pw, ph, s);
}

function drawSecondaryWindow(ctx, state, panel, x, y, pw, ph, s) {
  drawPanelChrome(ctx, x, y, pw, ph, panel.toUpperCase());
  ctx.save();
  ctx.fillStyle = UI_THEME.label;
  ctx.font = `${Math.round(10 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('Panel baseline (placeholder)', x + 12 * s, y + 38 * s);
  // separators
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10 * s, y + 48 * s);
  ctx.lineTo(x + pw - 10 * s, y + 48 * s);
  ctx.stroke();
  if (panel === 'character') {
    const p = state.player;
    ctx.fillStyle = UI_THEME.value;
    ctx.fillText(`Level ${p.level}   HP ${p.hp}/${p.maxHp}`, x + 12 * s, y + 68 * s);
    ctx.fillText(`STR ${p.stats?.str ?? 0}  VIT ${p.stats?.vit ?? 0}  AGI ${p.stats?.agi ?? 0}`, x + 12 * s, y + 84 * s);
  }
  if (panel === 'inventory') {
    for (let i = 0; i < 10; i++) {
      const gx = x + 12 * s + (i % 5) * (34 * s);
      const gy = y + 58 * s + Math.floor(i / 5) * (34 * s);
      ctx.fillStyle = UI_THEME.slotBase;
      ctx.fillRect(gx, gy, 28 * s, 28 * s);
      ctx.strokeStyle = UI_THEME.borderMid;
      ctx.strokeRect(gx + 0.5, gy + 0.5, 28 * s - 1, 28 * s - 1);
    }
  }
  if (panel === 'settings') {
    ctx.fillStyle = UI_THEME.value;
    ctx.fillText('ESC to close', x + 12 * s, y + 68 * s);
  }
  ctx.restore();
}

// Commands panel intentionally removed for lightweight MMO feel.

function drawRoundOverlay(ctx, state, cw, ch) {
  ctx.fillStyle = COLOR_OVERLAY_BG;
  ctx.fillRect(0, 0, cw, ch);
  const won = state.roundState === 'win';
  ctx.fillStyle = COLOR_OVERLAY_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const title = won ? UI_WIN_TITLE : UI_LOSE_TITLE;
  ctx.fillText(title, cw * 0.5, ch * 0.5 - 16);
  ctx.fillStyle = COLOR_OVERLAY_SUB;
  ctx.font = '15px monospace';
  const sub = won
    ? (isLastZone(state.currentZoneId) ? UI_WIN_SUB_FINALE : UI_WIN_SUB_NEXT)
    : UI_LOSE_SUB;
  ctx.fillText(sub, cw * 0.5, ch * 0.5 + 12);
}

function drawDebugOverlay(ctx, state, fps, cw, ch) {
  const p = state.player;
  const c = state.camera;
  const gnd  = p.grounded ? 1 : 0;
  const f1  = n => n.toFixed(1).padStart(7, ' ');
  const ui = state._ui ?? {};
  const lines = [
    `fps ${String(fps).padStart(3, ' ')}`,
    `p.x ${f1(p.x)}  p.y ${f1(p.y)}`,
    `v.x ${f1(p.vx)}  v.y ${f1(p.vy)}`,
    `gnd ${gnd}`,
    `st  ${p.state}`,
    `cmb ${p.comboIndex}`,
    `panel ${ui.openPanel ?? '-'}`,
    `c.x ${String(Math.round(c.x)).padStart(4, ' ')}  c.y ${String(Math.round(c.y)).padStart(4, ' ')}`,
  ];
  const nL = lines.length;
  const bh  = nL * DEBUG_LH + DEBUG_PAD * 2;
  const bx  = 8;
  const by  = ch - bh - 8;
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

function drawRedVignette(ctx, a) {
  const cw = ctx.canvas?.width || CANVAS_W;
  const ch = ctx.canvas?.height || CANVAS_H;
  const edge = 68;
  ctx.save();
  // top
  let g = ctx.createLinearGradient(0, 0, 0, edge);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, edge);
  // bottom
  g = ctx.createLinearGradient(0, ch, 0, ch - edge);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, ch - edge, cw, edge);
  // left
  g = ctx.createLinearGradient(0, 0, edge, 0);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, edge, ch);
  // right
  g = ctx.createLinearGradient(cw, 0, cw - edge, 0);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cw - edge, 0, edge, ch);
  ctx.restore();
}
