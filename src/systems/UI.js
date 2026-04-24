// ============================================================
// WAYFINDER — UI.js
// Premium RPG HUD style pass for 2D side-scroller layout.
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  COLOR_DEBUG_BG, COLOR_DEBUG_TEXT,
  UI_LOSE_TITLE, UI_LOSE_SUB, UI_WIN_TITLE,
  UI_WIN_SUB_NEXT, UI_WIN_SUB_FINALE,
  COLOR_OVERLAY_BG, COLOR_OVERLAY_TITLE, COLOR_OVERLAY_SUB,
  ABILITY_MOVE_CD, ABILITY_DAMAGE_CD, ABILITY_GUARD_CD,
} from '../config/Constants.js';
import { isLastZone } from '../data/zones.js';

const DEBUG_LH  = 12;
const DEBUG_PAD = 4;
const DEBUG_W   = 168;

const UI = {
  panelTop: '#12161C',
  panelBottom: '#0C0F14',
  goldLight: '#E7C77A',
  goldBase: '#C9A45B',
  goldInner: '#3A2E1F',
  goldDark: '#7A5A2A',
  hpRed: '#D84A4A',
  hpRedDark: '#7A1F1F',
  manaBlue: '#4A90E2',
  manaBlueDark: '#1F3F7A',
  cooldownBlack: '#000000',
  white: '#FFFFFF',
  slotTop: '#1A1D22',
  slotBottom: '#0C0F13',
};

const UI_SPACE = {
  panelPad: 12,
  gap: 8,
  top: 20,
  side: 20,
  skillBottom: 80,
  skillGap: 10,
  skillSize: 48,
};

function rp(v) { return Math.round(v); }

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
  if (input.settingsPressed) ui.openPanel = ui.openPanel ? null : 'settings';

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
  const s = small ? 0.9 : 1;
  const minimized = ui.recentCombatTimer <= 0 && !ui.openPanel && state.roundState === 'playing';

  drawBottomSystemStrip(ctx, cw, ch);
  drawVitalsPanel(ctx, state, UI_SPACE.side * s, UI_SPACE.top * s, s, minimized);
  drawObjectivePanel(ctx, state, cw - (small ? 248 : 270), UI_SPACE.top * s, small ? 228 : 250, s, minimized);
  drawSkillBar(ctx, state, cw * 0.5, ch - UI_SPACE.skillBottom * s, s);
  drawQuickItem(ctx, state, UI_SPACE.side * s, ch - UI_SPACE.skillBottom * s, s, minimized);

  if (ui.openPanel) drawSecondaryPanels(ctx, state, ui.openPanel, cw, ch, s);
  if (state.roundState !== 'playing') drawRoundOverlay(ctx, state, cw, ch);
  if (state.debug) drawDebugOverlay(ctx, state, fps, cw, ch);
}

function drawPanel(ctx, x, y, w, h) {
  x = rp(x); y = rp(y); w = rp(w); h = rp(h);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(18,22,28,0.90)');
  g.addColorStop(1, 'rgba(12,15,20,0.95)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  // Inner shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = 'rgba(0,0,0,0.01)';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.restore();

  // Double border.
  ctx.strokeStyle = UI.goldBase;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = UI.goldInner;
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);

  // Subtle glow.
  ctx.shadowColor = 'rgba(231,199,122,0.08)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(231,199,122,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawBottomSystemStrip(ctx, cw, ch) {
  const y = ch - 92;
  const g = ctx.createLinearGradient(0, y, 0, ch);
  g.addColorStop(0, 'rgba(27,31,36,0.40)');
  g.addColorStop(1, 'rgba(14,17,21,0.68)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, y, cw, 92);
  ctx.strokeStyle = 'rgba(201,164,91,0.50)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, rp(y) + 0.5);
  ctx.lineTo(cw, rp(y) + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawVitalsPanel(ctx, state, x, y, s, minimized) {
  const p = state.player;
  const w = (minimized ? 184 : 208) * s;
  const h = (minimized ? 56 : 78) * s;
  drawPanel(ctx, x, y, w, h);

  const pad = UI_SPACE.panelPad * s;
  const gap = UI_SPACE.gap * s;
  const px = x + pad;
  const py = y + (pad + 6 * s);
  const ps = 40 * s;
  ctx.save();
  // Circular portrait frame
  ctx.fillStyle = '#10151b';
  ctx.beginPath();
  ctx.arc(px + ps * 0.5, py + ps * 0.5, ps * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = UI.goldBase;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px + ps * 0.5, py + ps * 0.5, ps * 0.5 - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `${rp(12 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('P', px + ps * 0.5, py + ps * 0.62);
  // Level badge
  ctx.fillStyle = '#111';
  ctx.fillRect(px + ps - 12 * s, py + ps - 12 * s, 14 * s, 12 * s);
  ctx.strokeStyle = UI.goldLight;
  ctx.strokeRect(px + ps - 12 * s + 0.5, py + ps - 12 * s + 0.5, 14 * s - 1, 12 * s - 1);
  ctx.fillStyle = UI.goldLight;
  ctx.font = `${rp(8 * s)}px monospace`;
  ctx.fillText(String(p.level ?? 1), px + ps - 5 * s, py + ps - 3 * s);

  const bx = px + ps + gap;
  const bw = w - (bx - x) - pad;
  const hpY = y + pad;
  const hpH = 10 * s;
  const hpPct = Math.max(0, Math.min(1, p.hp / p.maxHp));
  const hpGrad = ctx.createLinearGradient(0, hpY, 0, hpY + hpH);
  hpGrad.addColorStop(0, UI.hpRed);
  hpGrad.addColorStop(1, UI.hpRedDark);
  ctx.fillStyle = 'rgba(24,12,12,0.75)';
  ctx.fillRect(bx, hpY, bw, hpH);
  ctx.fillStyle = hpGrad;
  ctx.fillRect(bx, hpY, bw * hpPct, hpH);
  ctx.shadowColor = 'rgba(216,74,74,0.25)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect(bx + 0.5, hpY + 0.5, bw - 1, hpH - 1);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.font = `bold ${rp(10 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`${p.hp}/${p.maxHp}`, bx + 4 * s, hpY + 8 * s);

  if (!minimized) {
    const rY = hpY + 10 * s + gap * 0.75;
    const rH = 8 * s;
    const r = p.resource ?? p.mp ?? 0;
    const rMax = p.maxResource ?? p.maxMp ?? 0;
    const rPct = rMax > 0 ? Math.max(0, Math.min(1, r / rMax)) : 1;
    const manaGrad = ctx.createLinearGradient(0, rY, 0, rY + rH);
    manaGrad.addColorStop(0, UI.manaBlue);
    manaGrad.addColorStop(1, UI.manaBlueDark);
    ctx.fillStyle = 'rgba(16,22,34,0.75)';
    ctx.fillRect(bx, rY, bw, rH);
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = manaGrad;
    ctx.fillRect(bx, rY, bw * rPct, rH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.font = `${rp(9 * s)}px monospace`;
    const rTxt = rMax > 0 ? `${r}/${rMax}` : 'TODO';
    ctx.fillText(rTxt, bx + 4 * s, rY + 7 * s);
  }
  ctx.restore();

  if (hpPct <= 0.25) {
    const pulse = 0.45 + 0.35 * Math.sin((state._ui?.lowHpPulse ?? 0) * 12);
    drawRedVignette(ctx, 0.20 + pulse * 0.20);
  }
}

function drawObjectivePanel(ctx, state, x, y, w, s, minimized) {
  if (minimized) return;
  const h = 48 * s;
  const pad = UI_SPACE.panelPad * s;
  drawPanel(ctx, x, y, w, h);
  const nonProj = state.enemies.filter(e => e.type !== 'projectile');
  const total = nonProj.length;
  const alive = nonProj.filter(e => e.alive).length;
  const done = total - alive;
  ctx.save();
  ctx.globalAlpha = 0.80;
  ctx.fillStyle = UI.goldLight;
  ctx.font = `bold ${rp(10 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`${state.currentZoneId.toUpperCase()}`, x + pad, y + 18 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${rp(9 * s)}px monospace`;
  ctx.fillText(`Clear enemies ${done}/${total}`, x + pad, y + 34 * s);
  ctx.restore();
}

function drawSkillBar(ctx, state, cx, y, s) {
  const p = state.player;
  const slots = [
    { key: '1', cd: Math.max(0, p.abilityMoveCd ?? 0), maxCd: ABILITY_MOVE_CD, color: '#2f7dd2' },
    { key: '2', cd: Math.max(0, p.abilityDamageCd ?? 0), maxCd: ABILITY_DAMAGE_CD, color: '#6d39a8' },
    { key: '3', cd: Math.max(0, p.abilityGuardCd ?? 0), maxCd: ABILITY_GUARD_CD, color: '#3c8b42' },
    { key: '4', cd: 0, maxCd: 1, color: '#d06a2f' },
    { key: 'Q', cd: 0, maxCd: 1, color: '#5e5e5e' },
  ];
  const size = UI_SPACE.skillSize * s;
  const gap = UI_SPACE.skillGap * s;
  const totalW = slots.length * size + (slots.length - 1) * gap;
  const x0 = cx - totalW * 0.5;
  const activeIndex = 0;
  const pulse = 0.15 + (0.30 - 0.15) * ((Math.sin((state._ui?.lowHpPulse ?? 0) * (2 * Math.PI * 2.0)) + 1) * 0.5);

  drawPanel(ctx, x0 - 12 * s, y - 12 * s, totalW + 24 * s, size + 24 * s);

  for (let i = 0; i < slots.length; i++) {
    const sl = slots[i];
    const sx = rp(x0 + i * (size + gap));
    const sy = rp(y);
    const g = ctx.createLinearGradient(0, sy, 0, sy + size);
    g.addColorStop(0, UI.slotTop);
    g.addColorStop(1, UI.slotBottom);
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, size, size);
    ctx.strokeStyle = UI.goldBase;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, size - 1, size - 1);
    ctx.strokeStyle = UI.goldInner;
    ctx.strokeRect(sx + 2.5, sy + 2.5, size - 5, size - 5);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(sx + 6 * s, sy + size - 13 * s, size - 12 * s, 7 * s);
    const iconGrad = ctx.createLinearGradient(0, sy + 10 * s, 0, sy + size - 10 * s);
    iconGrad.addColorStop(0, sl.color);
    iconGrad.addColorStop(1, 'rgba(12,15,19,0.85)');
    ctx.fillStyle = iconGrad;
    ctx.fillRect(sx + 10 * s, sy + 10 * s, size - 20 * s, size - 20 * s);

    // Ready state glow pulse
    if (sl.cd <= 0.001) {
      ctx.shadowColor = `rgba(231,199,122,${pulse})`;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = `rgba(231,199,122,${pulse + 0.10})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
      ctx.shadowBlur = 0;
    }
    // Active state
    if (i === activeIndex) {
      ctx.shadowColor = 'rgba(231,199,122,0.35)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = UI.goldLight;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1.5, sy + 1.5, size - 3, size - 3);
      ctx.shadowBlur = 0;
    }

    // Cooldown overlay bottom -> top
    if (sl.cd > 0) {
      const ratio = Math.max(0, Math.min(1, sl.cd / sl.maxCd));
      const fillH = size * ratio;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(sx, sy + (size - fillH), size, fillH);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold ${rp(14 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(sl.cd.toFixed(1), sx + size * 0.5, sy + size * 0.60);
    }

    // key label chip
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + size * 0.34, sy + size - 12 * s, size * 0.32, 11 * s);
    ctx.strokeStyle = UI.goldBase;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + size * 0.34 + 0.5, sy + size - 12 * s + 0.5, size * 0.32 - 1, 10 * s);
    ctx.fillStyle = UI.white;
    ctx.font = `${rp(9 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(sl.key, sx + size * 0.5, sy + size - 3 * s);
    ctx.restore();
  }
}

function drawQuickItem(ctx, state, x, y, s, minimized) {
  if (minimized) return;
  const quick = state.player.quickItem ?? true; // keep visible as placeholder slot.
  if (!quick) return;
  const size = 48 * s;
  drawPanel(ctx, x, y, size, size);
  const g = ctx.createLinearGradient(0, y, 0, y + size);
  g.addColorStop(0, UI.slotTop);
  g.addColorStop(1, UI.slotBottom);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = UI.goldBase;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x + 13 * s, y + 12 * s, size - 26 * s, size - 24 * s);
  ctx.fillStyle = UI.white;
  ctx.font = `${rp(9 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('R', x + size * 0.5, y + size - 6 * s);
  ctx.restore();
}

function drawSecondaryPanels(ctx, state, panel, cw, ch, s) {
  const pw = Math.min(290 * s, cw - 24 * s);
  const ph = Math.min(200 * s, ch - 90 * s);
  const y = (ch - ph) * 0.58;
  const xl = cw * 0.5 - pw - 8 * s;
  const xr = cw * 0.5 + 8 * s;
  if (panel === 'inventory' || panel === 'character') {
    drawSecondaryPanel(ctx, state, 'inventory', xl, y, pw, ph, s);
    drawSecondaryPanel(ctx, state, 'character', xr, y, pw, ph, s);
    return;
  }
  drawSecondaryPanel(ctx, state, panel, cw * 0.5 - pw * 0.5, y, pw, ph, s);
}

function drawSecondaryPanel(ctx, state, panel, x, y, w, h, s) {
  drawPanel(ctx, x, y, w, h);
  ctx.save();
  ctx.fillStyle = UI.goldLight;
  ctx.font = `bold ${rp(10 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(panel.toUpperCase(), x + 10 * s, y + 16 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `${rp(9 * s)}px monospace`;
  if (panel === 'character') {
    const p = state.player;
    ctx.fillText(`Level ${p.level}  HP ${p.hp}/${p.maxHp}`, x + 12 * s, y + 36 * s);
    ctx.fillText(`STR ${p.stats?.str ?? 0}  VIT ${p.stats?.vit ?? 0}  AGI ${p.stats?.agi ?? 0}`, x + 12 * s, y + 50 * s);
  } else if (panel === 'inventory') {
    for (let i = 0; i < 10; i++) {
      const gx = x + 12 * s + (i % 5) * (34 * s);
      const gy = y + 30 * s + Math.floor(i / 5) * (34 * s);
      ctx.fillStyle = 'rgba(16,20,26,0.8)';
      ctx.fillRect(gx, gy, 28 * s, 28 * s);
      ctx.strokeStyle = UI.goldDark;
      ctx.strokeRect(gx + 0.5, gy + 0.5, 28 * s - 1, 28 * s - 1);
    }
  } else if (panel === 'settings') {
    ctx.fillText('ESC to close', x + 12 * s, y + 36 * s);
  } else {
    ctx.fillText('Panel baseline (placeholder)', x + 12 * s, y + 36 * s);
  }
  ctx.restore();
}

function drawRoundOverlay(ctx, state, cw, ch) {
  ctx.fillStyle = COLOR_OVERLAY_BG;
  ctx.fillRect(0, 0, cw, ch);
  const won = state.roundState === 'win';
  ctx.fillStyle = COLOR_OVERLAY_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? UI_WIN_TITLE : UI_LOSE_TITLE, cw * 0.5, ch * 0.5 - 16);
  ctx.fillStyle = COLOR_OVERLAY_SUB;
  ctx.font = '15px monospace';
  const sub = won ? (isLastZone(state.currentZoneId) ? UI_WIN_SUB_FINALE : UI_WIN_SUB_NEXT) : UI_LOSE_SUB;
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
  let yy = by + DEBUG_PAD;
  for (let i = 0; i < nL; i++) {
    ctx.fillText(lines[i], bx + DEBUG_PAD, yy);
    yy += DEBUG_LH;
  }
}

function drawRedVignette(ctx, a) {
  const cw = ctx.canvas?.width || CANVAS_W;
  const ch = ctx.canvas?.height || CANVAS_H;
  const edge = 68;
  ctx.save();
  let g = ctx.createLinearGradient(0, 0, 0, edge);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, edge);
  g = ctx.createLinearGradient(0, ch, 0, ch - edge);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, ch - edge, cw, edge);
  g = ctx.createLinearGradient(0, 0, edge, 0);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, edge, ch);
  g = ctx.createLinearGradient(cw, 0, cw - edge, 0);
  g.addColorStop(0, `rgba(180,20,20,${a})`);
  g.addColorStop(1, 'rgba(180,20,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cw - edge, 0, edge, ch);
  ctx.restore();
}
