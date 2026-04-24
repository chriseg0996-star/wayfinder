// ============================================================
// World-space parallax — 3 depth layers (back→front):
//   far  = sky (slowest parallax)   |  mid  = trees / mountains
//   near = ground-hug scenery (fastest). All muted vs gameplay (1:1) pass.
// Grades: zone `bg` + optional parallaxTuning in data/zones.js. PNGs can replace fills later.
// ============================================================

import { CANVAS_W, CANVAS_H, COLOR_BG, READABILITY_PARALLAX_OPACITY_MULT } from '../config/Constants.js';
import { PARALLAX_LAYERS, DEFAULT_PARALLAX_TUNING } from './artConfig.js';
import { markAssetLoaded, markAssetMissing } from '../assets/assetContract.js';

/** @type {Record<string, HTMLImageElement | null | undefined>} */
const _parallaxImages = {};

/**
 * Optional image layers (assets/parallax/far.png, mid.png, near.png).
 * If image is unavailable, drawParallaxStack falls back to gradient fills.
 */
export function loadParallaxLayers() {
  if (typeof Image === 'undefined') {
    return;
  }
  for (const def of PARALLAX_LAYERS) {
    if (_parallaxImages[def.id] !== undefined) {
      continue;
    }
    const im = new Image();
    const path = `assets/parallax/${def.id}.png`;
    im.onload = () => {
      _parallaxImages[def.id] = im;
      markAssetLoaded(path, `image ${im.naturalWidth}x${im.naturalHeight}px`);
    };
    im.onerror = () => {
      _parallaxImages[def.id] = null;
      markAssetMissing(path, 'failed to load parallax layer');
    };
    im.src = path;
    _parallaxImages[def.id] = null;
  }
}

function parseHex(hex) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return { r: 13, g: 17, b: 23 };
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function toRgbString(o) {
  return `rgb(${o.r | 0},${o.g | 0},${o.b | 0})`;
}

/**
 * Mix rgb toward mid-gray to reduce saturation (0 = no change, 1 = full gray).
 */
function desaturateRgb(rgb, t) {
  const gx = 128;
  return {
    r: rgb.r + (gx - rgb.r) * t,
    g: rgb.g + (gx - rgb.g) * t,
    b: rgb.b + (gx - rgb.b) * t,
  };
}

/**
 * Darken by scaling channels toward 0.
 */
function darkenRgb(rgb, t) {
  const s = 1 - t;
  return { r: rgb.r * s, g: rgb.g * s, b: rgb.b * s };
}

/**
 * Pull rgb toward luma to lower local contrast (keeps platforms/entities reading “on top”).
 */
function lumaPull(rgb, t) {
  if (t <= 0) return rgb;
  const y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  const c = (v) => Math.max(0, Math.min(255, v + (y - v) * t));
  return { r: c(rgb.r), g: c(rgb.g), b: c(rgb.b) };
}

function buildLayerColor(baseHex, { desat, darken, contrastPull = 0 }, tuning, layerIndex) {
  let rgb = parseHex(baseHex);
  const d  = desat  + (tuning?.desatAdd?.[layerIndex]  ?? 0) + (DEFAULT_PARALLAX_TUNING.desatAdd[layerIndex]  ?? 0);
  const dk = darken + (tuning?.darkenAdd?.[layerIndex] ?? 0) + (DEFAULT_PARALLAX_TUNING.darkenAdd[layerIndex] ?? 0);
  rgb = desaturateRgb(rgb, Math.max(0, Math.min(1, d)));
  rgb = darkenRgb(rgb, Math.max(0, Math.min(0.85, dk)));
  rgb = lumaPull(rgb, Math.max(0, Math.min(0.4, contrastPull)));
  return toRgbString(rgb);
}

/**
 * Slightly different stops for each layer for silhouette separation.
 */
function layerGradientStops(def, cTop, cHub, cBot) {
  const h = def.horizonY;
  return (g) => {
    g.addColorStop(0, cTop);
    g.addColorStop(Math.max(0, h - 0.1), cHub);
    g.addColorStop(h, cHub);
    g.addColorStop(1, cBot);
  };
}

function drawLayerImageTiledX(ctx, img, w, h) {
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (!iw || !ih) {
    return false;
  }
  const scale = h / ih;
  const drawW = Math.max(1, Math.round(iw * scale));
  ctx.imageSmoothingEnabled = false;
  // Draw enough tiles to cover visible level width.
  for (let x = 0; x < w + drawW; x += drawW) {
    ctx.drawImage(img, x, 0, drawW, h);
  }
  return true;
}

/**
 * Multi-layer world parallax: far → mid → near (painter: back to front in depth).
 * @param {object} [state.parallaxTuning] optional; from data/zones.js
 */
export function drawParallaxStack(ctx, state, cam) {
  const base    = state.zoneBg || COLOR_BG;
  const tun     = state.parallaxTuning ?? null;
  const w       = state.levelW;
  const h       = state.levelH;

  PARALLAX_LAYERS.forEach((def, i) => {
    const ox = -Math.round(cam.x * def.multX);
    const oy = -Math.round(cam.y * def.multY);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalAlpha = def.opacity * READABILITY_PARALLAX_OPACITY_MULT;
    const img = _parallaxImages[def.id];
    const usedImage = !!img && drawLayerImageTiledX(ctx, img, w, h);
    if (!usedImage) {
      const cp    = def.contrastPull ?? 0;
      const cTop  = buildLayerColor(base, { desat: def.desat, darken: 0.05, contrastPull: cp }, tun, i);
      const cHub  = buildLayerColor(base, { desat: def.desat, darken: def.darken * 0.5, contrastPull: cp }, tun, i);
      const cBot  = buildLayerColor(base, { desat: def.desat, darken: def.darken, contrastPull: cp }, tun, i);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      layerGradientStops(def, cTop, cHub, cBot)(g);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

/**
 * Screen-locked underpaint: dark neutral so gameplay + parallax read as *back*;
 * slightly deeper mid-tones for separation from the 1:1 world layer.
 * Does not scroll with camera.
 */
export function drawScreenBase(ctx, state) {
  const base = state.zoneBg || COLOR_BG;
  const b0   = lumaPull(desaturateRgb(parseHex(base), 0.5), 0.06);
  const rgb0 = desaturateRgb(parseHex(base), 0.42);
  const r1   = darkenRgb(rgb0, 0.52);
  const r2   = darkenRgb(parseHex(base), 0.58);
  const g    = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0,   toRgbString(darkenRgb(b0, 0.66)));
  g.addColorStop(0.5, toRgbString(r1));
  g.addColorStop(1,   toRgbString(darkenRgb(r2, 0.25)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

/**
 * @deprecated use drawParallaxStack — kept as alias
 */
export function drawBackPlaceholderParallax(ctx, state, cam) {
  drawParallaxStack(ctx, state, cam);
}
