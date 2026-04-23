// ============================================================
// WAYFINDER — ControlsMenuUI.js
// MapleStory-style controls panel (render-only).
// Pure canvas drawing: no input handling, no gameplay coupling.
// ============================================================

/**
 * Default key bindings (config-only; logic reads its own bindings elsewhere).
 */
export const KEYBINDS = {
  move:  { up: 'W / ↑', left: 'A / ←', down: 'S / ↓', right: 'D / →' },
  jump:  'Space',
  attack:'J / Z',
  skills:['1', '2', '3', '4'],
};

const UI = {
  panel: {
    bg:     'rgba(9, 14, 24, 0.92)',
    border: 'rgba(130, 170, 255, 0.42)',
    title:  '#d9e3ff',
    text:   '#a9bddf',
    accent: '#88a8ff',
  },
  key: {
    bg:        '#1b273a',
    edgeLight: 'rgba(171, 198, 255, 0.65)',
    edgeDark:  'rgba(7, 10, 16, 0.95)',
    label:     '#eef4ff',
    shadow:    'rgba(0, 0, 0, 0.35)',
  },
};

/**
 * Reusable keycap renderer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {number} [size=30]
 */
export function drawKey(ctx, x, y, label, size = 30) {
  const s = size | 0;
  ctx.save();
  ctx.fillStyle = UI.key.shadow;
  ctx.fillRect(x + 1, y + 2, s, s);

  ctx.fillStyle = UI.key.bg;
  ctx.fillRect(x, y, s, s);

  ctx.strokeStyle = UI.key.edgeDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  ctx.strokeStyle = UI.key.edgeLight;
  ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3);

  ctx.fillStyle = UI.key.label;
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + s * 0.5, y + s * 0.52);
  ctx.restore();
}

/**
 * Controls menu renderer (MapleStory-style panel + keycaps).
 * Rendering is decoupled from gameplay logic; pass any keybind config object.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {{
 *   move: { up: string, left: string, down: string, right: string },
 *   jump: string,
 *   attack: string,
 *   skills: string[]
 * }} [binds=KEYBINDS]
 */
export function drawControlsMenu(ctx, x, y, width, height, binds = KEYBINDS) {
  const panelX = x | 0;
  const panelY = y | 0;
  const w = width | 0;
  const h = height | 0;
  const pad = 14;
  const key = 30;
  const gap = 6;

  ctx.save();
  // Panel
  ctx.fillStyle = UI.panel.bg;
  ctx.fillRect(panelX, panelY, w, h);
  ctx.strokeStyle = UI.panel.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, w - 1, h - 1);

  // Title
  ctx.fillStyle = UI.panel.title;
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Controls', panelX + pad, panelY + pad - 2);

  // Arrow-key cluster (classic cross layout)
  const clusterX = panelX + pad + 10;
  const clusterY = panelY + 56;
  drawKey(ctx, clusterX + key + gap, clusterY, binds.move.up, key);
  drawKey(ctx, clusterX, clusterY + key + gap, binds.move.left, key);
  drawKey(ctx, clusterX + key + gap, clusterY + key + gap, binds.move.down, key);
  drawKey(ctx, clusterX + (key + gap) * 2, clusterY + key + gap, binds.move.right, key);

  ctx.fillStyle = UI.panel.accent;
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('Move', clusterX + key + gap - 2, clusterY + key * 2 + gap + 14);

  // Action keys
  const rightX = panelX + Math.floor(w * 0.5) + 12;
  const row1Y = panelY + 64;
  drawKey(ctx, rightX, row1Y, binds.jump, key);
  drawKey(ctx, rightX + key + gap, row1Y, binds.attack, key);
  ctx.fillStyle = UI.panel.text;
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Jump', rightX, row1Y + key + 12);
  ctx.fillText('Attack', rightX + key + gap, row1Y + key + 12);

  // Skills row
  const skillsY = row1Y + 56;
  ctx.fillStyle = UI.panel.accent;
  ctx.fillText('Skills', rightX, skillsY - 16);
  const skills = binds.skills ?? [];
  for (let i = 0; i < skills.length; i++) {
    drawKey(ctx, rightX + i * (key + gap), skillsY, skills[i], key);
  }

  ctx.restore();
}

/**
 * Example layout helper: centered panel on current canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasW
 * @param {number} canvasH
 */
export function drawControlsMenuExample(ctx, canvasW, canvasH) {
  const w = 430;
  const h = 230;
  const x = Math.floor((canvasW - w) * 0.5);
  const y = Math.floor((canvasH - h) * 0.5);
  drawControlsMenu(ctx, x, y, w, h, KEYBINDS);
}
