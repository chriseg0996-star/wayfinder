// ============================================================
// World-space parallax background stack (no collision, no gameplay).
// 3 layers: far / mid / near — gradients tinted from state.zoneBg.
// Replace per-layer with drawImage when assets/backgrounds/* exist.
// ============================================================

import { CANVAS_W, CANVAS_H, COLOR_BG } from '../config/Constants.js';
import { PARALLAX_LAYERS, DEFAULT_PARALLAX_TUNING } from './artConfig.js';

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

function buildLayerColor(baseHex, { desat, darken }, tuning, layerIndex) {
  let rgb = parseHex(baseHex);
  const d  = desat  + (tuning?.desatAdd?.[layerIndex]  ?? 0) + (DEFAULT_PARALLAX_TUNING.desatAdd[layerIndex]  ?? 0);
  const dk = darken + (tuning?.darkenAdd?.[layerIndex] ?? 0) + (DEFAULT_PARALLAX_TUNING.darkenAdd[layerIndex] ?? 0);
  rgb = desaturateRgb(rgb, Math.max(0, Math.min(1, d)));
  rgb = darkenRgb(rgb, Math.max(0, Math.min(0.85, dk)));
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
    const cTop  = buildLayerColor(base, { desat: def.desat, darken: 0.05 }, tun, i);
    const cHub  = buildLayerColor(base, { desat: def.desat, darken: def.darken * 0.5 }, tun, i);
    const cBot  = buildLayerColor(base, { desat: def.desat, darken: def.darken }, tun, i);

    const ox = -Math.round(cam.x * def.multX);
    const oy = -Math.round(cam.y * def.multY);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalAlpha = def.opacity;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    layerGradientStops(def, cTop, cHub, cBot)(g);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
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
  const rgb0 = desaturateRgb(parseHex(base), 0.35);
  const r1   = darkenRgb(rgb0, 0.5);
  const r2   = darkenRgb(parseHex(base), 0.55);
  const g    = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0,   toRgbString(darkenRgb(desaturateRgb(parseHex(base), 0.5), 0.65)));
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
