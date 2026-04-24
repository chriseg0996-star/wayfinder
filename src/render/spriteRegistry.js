// ============================================================
// Sprite sheets: optional PNGs under assets/sprites/, or generated
// placeholder canvases (always valid CanvasImageSource for the pipeline).
// loadSpriteRegistry() is called from main.js; PNG onload overrides placeholder.
// ============================================================

import {
  PLAYER_SHEET, SLIME_SHEET, ARCHER_SHEET, BRUTE_SHEET,
  PLAYER_SHEET_PIXEL_SIZE, SLIME_SHEET_PIXEL_SIZE, ARCHER_SHEET_PIXEL_SIZE, BRUTE_SHEET_PIXEL_SIZE,
} from './spriteConfig.js';
import { markAssetInvalid, markAssetLoaded, markAssetMissing } from '../assets/assetContract.js';

/** @type {CanvasImageSource | null} */
let playerSheet = null;
/** @type {CanvasImageSource | null} */
let slimeSheet  = null;
/** @type {CanvasImageSource | null} */
let archerSheet = null;
/** @type {CanvasImageSource | null} */
let bruteSheet  = null;

/**
 * @returns {CanvasImageSource | null}
 */
export function getPlayerSheet() {
  return playerSheet;
}

/**
 * @returns {CanvasImageSource | null}
 */
export function getSlimeSheet() {
  return slimeSheet;
}

/**
 * @returns {CanvasImageSource | null}
 */
export function getArcherSheet() {
  return archerSheet;
}
/**
 * @returns {CanvasImageSource | null}
 */
export function getBruteSheet() {
  return bruteSheet;
}

/**
 * @param {CanvasImageSource} src
 */
export function registerPlayerSheet(src) {
  playerSheet = src;
}

/**
 * @param {CanvasImageSource} src
 */
export function registerSlimeSheet(src) {
  slimeSheet = src;
}

/**
 * @param {CanvasImageSource} src
 */
export function registerArcherSheet(src) {
  archerSheet = src;
}
/**
 * @param {CanvasImageSource} src
 */
export function registerBruteSheet(src) {
  bruteSheet = src;
}

/**
 * @param {typeof PLAYER_SHEET} sheet
 * @param {string} id - label for first-row tint offset
 * @returns {HTMLCanvasElement}
 */
function makePlaceholderStripCanvas(sheet, id) {
  const { frameW, frameH, rows } = sheet;
  const keys = Object.keys(rows);
  let maxW  = 0;
  for (const k of keys) {
    const r = rows[k];
    maxW    = Math.max(maxW, r.frames * frameW);
  }
  const maxRow = Math.max(
    0,
    ...keys.map(kk => /** @type {{ row: number }} */ (rows[kk]).row),
  ) + 1;
  const h = maxRow * frameH;
  const c   = document.createElement('canvas');
  c.width   = maxW;
  c.height  = h;
  const g   = c.getContext('2d');
  if (!g) {
    return c;
  }
  const baseH = id === 'player' ? 210 : id === 'archer' ? 95 : id === 'brute' ? 28 : 130;
  const entityId = id === 'player' ? 'player' : id === 'archer' ? 'archer' : id === 'brute' ? 'brute' : 'slime';
  for (const k of keys) {
    const spec = rows[k];
    for (let f = 0; f < spec.frames; f++) {
      const hHue = (baseH + spec.row * 20 + f * 6) % 360;
      const x  = f * frameW;
      const y0 = spec.row * frameH;
      g.fillStyle = `hsl(${hHue} 45% 40%)`;
      g.fillRect(x, y0, frameW, frameH);
      drawAnimPlaceholder(g, x, y0, frameW, frameH, entityId, k, f, spec.frames);
      g.strokeStyle = 'rgba(0,0,0,0.4)';
      g.lineWidth   = 1;
      g.strokeRect(x + 0.5, y0 + 0.5, frameW - 1, frameH - 1);
    }
  }
  return c;
}

/**
 * Silhouette hints per key so motion reads in-game with placeholder sheets.
 * @param {CanvasRenderingContext2D} g
 * @param {'player' | 'slime'} ent
 */
function drawAnimPlaceholder(g, x, y, fw, fh, ent, key, f, nF) {
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = 'source-over';
  g.lineWidth = 1;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (ent === 'player') {
    drawPlayerAnimPlaceholder(g, fw, fh, key, f, nF);
  } else if (ent === 'archer') {
    drawArcherAnimPlaceholder(g, fw, fh, key, f, nF);
  } else if (ent === 'brute') {
    drawBruteAnimPlaceholder(g, fw, fh, key, f, nF);
  } else {
    drawSlimeAnimPlaceholder(g, fw, fh, key, f, nF);
  }
  g.restore();
}

/** @param {CanvasRenderingContext2D} g */
function drawPlayerAnimPlaceholder(g, fw, fh, key, f, nF) {
  const c = 4;
  const w = fw - c * 2;
  const h = fh - c * 2;
  const a = 0.55;
  g.translate(c, c);
  g.globalAlpha = a;
  g.fillStyle = 'rgba(240, 248, 255, 0.65)';
  g.strokeStyle = 'rgba(0,0,0,0.2)';

  if (key === 'idle' || !key) {
    const by = Math.sin((f / Math.max(1, nF)) * Math.PI * 2) * 2.5;
    g.fillRect(w * 0.2, h * 0.12 + by, w * 0.55, h * 0.62);
    return;
  }
  if (key === 'run') {
    const sx = (f % 2 ? 1 : -1) * 2.5;
    g.fillRect(w * 0.2 + sx, h * 0.18, w * 0.5, h * 0.52);
    g.fillStyle    = 'rgba(255,255,255,0.35)';
    g.globalAlpha = 0.45;
    g.fillRect(0, h * 0.78, w * 0.28, 3);
    g.fillRect(w * 0.55, h * 0.8, w * 0.32, 3);
    return;
  }
  if (key === 'jump') {
    g.beginPath();
    g.moveTo(w * 0.5, 0);
    g.lineTo(w, h * 0.4);
    g.lineTo(0, h * 0.4);
    g.closePath();
    g.fill();
    g.globalAlpha = a;
    g.fillStyle = 'rgba(220, 240, 255, 0.4)';
    g.fillRect(w * 0.28, h * 0.35, w * 0.44, h * 0.5);
    return;
  }
  if (key === 'fall') {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w, 0);
    g.lineTo(w * 0.5, h * 0.4);
    g.closePath();
    g.fill();
    g.globalAlpha = a;
    g.fillStyle = 'rgba(200, 220, 255, 0.45)';
    g.fillRect(w * 0.1, h * 0.35, w * 0.8, h * 0.5);
    return;
  }
  if (key === 'attack_1' || key === 'attack_2' || key === 'attack_3') {
    const n = key === 'attack_1' ? 1 : key === 'attack_2' ? 2 : 3;
    g.fillRect(w * 0.2, h * 0.15, w * 0.4, h * 0.55);
    g.globalAlpha = 0.85;
    g.fillStyle   = 'rgba(255, 245, 200, 0.95)';
    g.fillRect(w * 0.4 + f * 3, h * 0.2 + f * 2, w * 0.45, 3 + f);
    g.font = 'bold 9px monospace';
    g.fillText(String(n), w * 0.1, 10);
    return;
  }
  if (key === 'dodge') {
    g.fillStyle   = 'rgba(160, 230, 255, 0.55)';
    g.fillRect(w * 0.15, h * 0.25, w * 0.4, h * 0.45);
    g.fillStyle   = 'rgba(255,255,255,0.25)';
    g.globalAlpha = 0.4 + f * 0.1;
    g.fillRect(0, h * 0.3 + f * 3, w * 0.85, 2);
    g.fillRect(2, h * 0.4 + f * 3, w * 0.7, 2);
    g.fillRect(0, h * 0.5 + f * 2, w * 0.75, 2);
    return;
  }
  if (key === 'hurt') {
    g.fillStyle = f === 0
      ? 'rgba(255, 180, 180, 0.75)'
      : 'rgba(255, 220, 200, 0.55)';
    g.fillRect(w * 0.1, h * 0.12, w * 0.75, h * 0.6);
    g.fillStyle   = 'rgba(40,20,20,0.4)';
    g.beginPath();
    g.moveTo(w * 0.2, h * 0.25);
    g.lineTo(w * 0.35, h * 0.4);
    g.lineTo(w * 0.25, h * 0.4);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.65, h * 0.25);
    g.lineTo(w * 0.5, h * 0.4);
    g.lineTo(w * 0.6, h * 0.4);
    g.closePath();
    g.fill();
    return;
  }
  g.fillRect(w * 0.2, h * 0.2, w * 0.45, h * 0.5);
}

/** @param {CanvasRenderingContext2D} g */
function drawSlimeAnimPlaceholder(g, fw, fh, key, f, nF) {
  const c = 3;
  g.translate(c, c);
  g.globalAlpha = 0.55;
  const w = fw - c * 2;
  const h = fh - c * 2;
  g.fillStyle = 'rgba(180, 255, 190, 0.5)';
  g.strokeStyle = 'rgba(0,30,0,0.2)';

  if (key === 'idle' || !key) {
    const r = 0.4 + 0.06 * Math.sin((f / Math.max(1, nF)) * Math.PI * 2);
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.5, w * (r * 0.5), h * 0.38, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(10, 30, 10, 0.4)';
    g.beginPath();
    g.arc(w * 0.38, h * 0.4, 2, 0, Math.PI * 2);
    g.arc(w * 0.62, h * 0.4, 2, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (key === 'move') {
    const sh = 2.5 * (f - nF * 0.5);
    g.beginPath();
    g.ellipse(w * 0.5 + sh, h * 0.5, w * 0.42, h * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle   = 'rgba(120, 200, 130, 0.3)';
    g.beginPath();
    g.ellipse(w * 0.35, h * 0.6, 4, 2, 0, 0, Math.PI * 2);
    g.ellipse(w * 0.65, h * 0.6, 4, 2, 0, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (key === 'telegraph') {
    g.font = 'bold 11px sans-serif';
    g.fillStyle = 'rgba(255, 200, 40, 0.4 + f * 0.1)';
    g.beginPath();
    g.arc(w * 0.5, h * 0.5, 4 + f * 1.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 100, 40, 0.3)';
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.55, w * 0.38, h * 0.28, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 220, 80, 0.5)';
    g.textAlign   = 'center';
    g.fillText('!', w * 0.5, h * 0.2);
    g.textAlign   = 'left';
    return;
  }
  if (key === 'attack') {
    g.beginPath();
    g.ellipse(w * 0.4 + f * 2, h * 0.5, w * 0.48, h * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 200, 0.35)';
    g.fillRect(w * 0.5 + f * 2, h * 0.3, 6, 2);
    return;
  }
  if (key === 'hurt') {
    g.fillStyle   = f === 0
      ? 'rgba(255, 160, 160, 0.5)'
      : 'rgba(255, 200, 200, 0.4)';
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.5, w * 0.4, h * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (key === 'death') {
    g.save();
    g.globalAlpha = 0.42 + 0.14 * f;
    const s = Math.max(0.3, 1 - f * 0.2);
    g.translate(w * 0.5, h * 0.55);
    g.scale(1, s);
    g.translate(-w * 0.5, -h * 0.55);
    g.fillStyle = 'rgba(70, 100, 72, 0.5)';
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.55, w * 0.5, h * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(28, 36, 30, 0.45)';
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.62, w * 0.55, h * 0.08, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

/** @param {CanvasRenderingContext2D} g */
function drawArcherAnimPlaceholder(g, fw, fh, key, f, nF) {
  const c = 3;
  const w = fw - c * 2;
  const h = fh - c * 2;
  g.translate(c, c);
  g.globalAlpha = 0.58;
  g.fillStyle = 'rgba(210, 230, 190, 0.65)';
  g.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  if (key === 'idle') {
    const by = Math.sin((f / Math.max(1, nF)) * Math.PI * 2) * 1.8;
    g.fillRect(w * 0.24, h * 0.16 + by, w * 0.46, h * 0.62);
    return;
  }
  if (key === 'move') {
    const sx = (f % 2 ? 1 : -1) * 2;
    g.fillRect(w * 0.24 + sx, h * 0.18, w * 0.46, h * 0.58);
    return;
  }
  if (key === 'aim' || key === 'shoot') {
    g.fillRect(w * 0.22, h * 0.2, w * 0.42, h * 0.56);
    g.fillStyle = 'rgba(255, 240, 190, 0.8)';
    g.fillRect(w * 0.42, h * 0.36, w * 0.45, 2);
    if (key === 'shoot') {
      g.globalAlpha = 0.6;
      g.fillRect(w * 0.82 + f * 1.5, h * 0.35, 4, 3);
    }
    return;
  }
  if (key === 'hurt') {
    g.fillStyle = 'rgba(255, 190, 190, 0.7)';
    g.fillRect(w * 0.18, h * 0.18, w * 0.5, h * 0.6);
    return;
  }
  if (key === 'death') {
    const s = Math.max(0.35, 1 - f * 0.12);
    g.save();
    g.translate(w * 0.5, h * 0.72);
    g.scale(1, s);
    g.translate(-w * 0.5, -h * 0.72);
    g.fillStyle = 'rgba(120, 120, 120, 0.65)';
    g.fillRect(w * 0.14, h * 0.56, w * 0.72, h * 0.2);
    g.restore();
    return;
  }
  g.fillRect(w * 0.24, h * 0.18, w * 0.46, h * 0.58);
}

/** @param {CanvasRenderingContext2D} g */
function drawBruteAnimPlaceholder(g, fw, fh, key, f, nF) {
  const c = 2;
  const w = fw - c * 2;
  const h = fh - c * 2;
  g.translate(c, c);
  g.globalAlpha = 0.6;
  g.fillStyle = 'rgba(205, 190, 170, 0.68)';
  if (key === 'idle') {
    g.fillRect(w * 0.18, h * 0.16, w * 0.64, h * 0.66);
    return;
  }
  if (key === 'move') {
    const sx = (f % 2 ? 1 : -1) * 1.8;
    g.fillRect(w * 0.16 + sx, h * 0.18, w * 0.66, h * 0.64);
    return;
  }
  if (key === 'attack') {
    g.fillRect(w * 0.16, h * 0.18, w * 0.62, h * 0.62);
    g.fillStyle = 'rgba(255,220,180,0.7)';
    g.fillRect(w * 0.62 + f * 1.2, h * 0.58, w * 0.26, 3);
    return;
  }
  if (key === 'hurt') {
    g.fillStyle = 'rgba(255,170,170,0.72)';
    g.fillRect(w * 0.18, h * 0.2, w * 0.64, h * 0.62);
    return;
  }
  if (key === 'death') {
    const s = Math.max(0.35, 1 - f * 0.13);
    g.save();
    g.translate(w * 0.5, h * 0.75);
    g.scale(1, s);
    g.translate(-w * 0.5, -h * 0.75);
    g.fillStyle = 'rgba(130,120,115,0.7)';
    g.fillRect(w * 0.08, h * 0.6, w * 0.84, h * 0.2);
    g.restore();
    return;
  }
  g.fillRect(w * 0.16, h * 0.18, w * 0.64, h * 0.64);
}

/**
 * Placeholders only. PNG sheets are intentionally disabled.
 * @returns {void}
 */
export function loadSpriteRegistry() {
  if (typeof document === 'undefined') {
    return;
  }
  registerPlayerSheet(makePlaceholderStripCanvas(PLAYER_SHEET, 'player'));
  registerSlimeSheet(makePlaceholderStripCanvas(SLIME_SHEET, 'slime'));
  registerArcherSheet(makePlaceholderStripCanvas(ARCHER_SHEET, 'archer'));
  registerBruteSheet(makePlaceholderStripCanvas(BRUTE_SHEET, 'brute'));

  // Attempt PNG load; placeholders remain active fallback on any failure.
  tryLoad('assets/sprites/player.png', registerPlayerSheet, 'player.png', PLAYER_SHEET_PIXEL_SIZE);
  tryLoad('assets/sprites/slime.png', registerSlimeSheet, 'slime.png', SLIME_SHEET_PIXEL_SIZE);
  tryLoad('assets/sprites/archer.png', registerArcherSheet, 'archer.png', ARCHER_SHEET_PIXEL_SIZE);
  tryLoad('assets/sprites/boar/Walk-Sheet.png', registerBruteSheet, 'boar/Walk-Sheet.png', BRUTE_SHEET_PIXEL_SIZE);
}

/**
 * @param {string} url
 * @param {(im: HTMLImageElement) => void} reg
 * @param {string} [label] - for console
 * @param {{ w: number, h: number }} [minPx] - from spriteConfig; warn if image smaller
 */
function tryLoad(url, reg, label, minPx) {
  const im = new Image();
  im.onload  = () => {
    if (minPx && (im.naturalWidth < minPx.w || im.naturalHeight < minPx.h)) {
      markAssetInvalid(
        url,
        `image ${im.naturalWidth}x${im.naturalHeight}px is below contract ${minPx.w}x${minPx.h}px`,
      );
      console.warn(
        `[Wayfinder sprites] ${label ?? url}: ` +
        `image is ${im.naturalWidth}×${im.naturalHeight}px; ` +
        `anim contract needs at least ${minPx.w}×${minPx.h}px. ` +
        'Frames are sampled from a fixed grid (see assets/sprites/README.md).',
      );
    } else {
      markAssetLoaded(url, `image ${im.naturalWidth}x${im.naturalHeight}px`);
    }
    reg(im);
  };
  im.onerror = () => {
    markAssetMissing(url, 'failed to load image');
    console.warn(`[Wayfinder sprites] missing or failed to load: ${label ?? url}`);
  };
  im.src     = url;
}
