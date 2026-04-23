// ============================================================
// Sprite sheets: optional PNGs under assets/sprites/, or generated
// placeholder canvases (always valid CanvasImageSource for the pipeline).
// loadSpriteRegistry() is called from main.js; PNG onload overrides placeholder.
// ============================================================

import { PLAYER_SHEET, SLIME_SHEET } from './spriteConfig.js';

/** @type {CanvasImageSource | null} */
let playerSheet = null;
/** @type {CanvasImageSource | null} */
let slimeSheet  = null;

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
  const baseH = id === 'player' ? 210 : 130;
  for (const k of keys) {
    const spec = rows[k];
    for (let f = 0; f < spec.frames; f++) {
      const hHue = (baseH + spec.row * 20 + f * 6) % 360;
      g.fillStyle = `hsl(${hHue} 45% 42%)`;
      g.fillRect(
        f * frameW, spec.row * frameH, frameW, frameH,
      );
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.strokeRect(
        f * frameW + 0.5, spec.row * frameH + 0.5, frameW - 1, frameH - 1,
      );
    }
  }
  return c;
}

/**
 * Placeholders first, then try PNG; load replaces the strip when ready.
 * @returns {void}
 */
export function loadSpriteRegistry() {
  if (typeof document === 'undefined') {
    return;
  }
  registerPlayerSheet(makePlaceholderStripCanvas(PLAYER_SHEET, 'player'));
  registerSlimeSheet(makePlaceholderStripCanvas(SLIME_SHEET, 'slime'));

  if (typeof Image === 'undefined') {
    return;
  }
  tryLoad('assets/sprites/player.png', registerPlayerSheet);
  tryLoad('assets/sprites/slime.png',  registerSlimeSheet);
}

/**
 * @param {string} url
 * @param {(im: HTMLImageElement) => void} reg
 */
function tryLoad(url, reg) {
  const im = new Image();
  im.onload  = () => { reg(im); };
  im.onerror = () => { /* keep placeholder */ };
  im.src     = url;
}
