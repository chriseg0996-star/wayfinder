// ============================================================
// Zone definitions — layout + spawns. Used by loadZone in GameState. No new maps here: edit entries only.
//
// Background: `bg` tints the 3 parallax gradient layers (far → mid → near in backgroundLayers).
// parallaxTuning (optional) — per layer index: [0]=far, [1]=mid, [2]=near, stacked on artConfig
//   PARALLAX_LAYERS + DEFAULT_PARALLAX_TUNING. desatAdd / darkenAdd: extra haze (Constants global dim
//   READABILITY_PARALLAX_OPACITY_MULT still applies to every layer’s opacity). Does not change scroll speed
//   (tune multX/Y only in `render/artConfig.js` PARALLAX_LAYERS).
// ============================================================

import { CANVAS_W, CANVAS_H } from '../config/Constants.js';

export const ZONE_ORDER = ['forest', 'ruins', 'cave'];

export const ZONES = {
  forest: {
    displayName: 'Whispering Forest',
    bg:         '#0d1117',
    // Slight haze, even across layers; easy outdoor read vs gameplay
    parallaxTuning: {
      desatAdd:  [0.02, 0.01, 0.01],
      darkenAdd: [0.02, 0.01, 0.01],
    },
    levelW:     CANVAS_W * 2,
    levelH:     CANVAS_H,
    spawn:      { x: 120, y: 300 },
    platforms:  [
      { x: 0,   y: 420, w: CANVAS_W * 2, h: 120 },
      { x: 300, y: 340, w: 160, h: 20 },
      { x: 560, y: 260, w: 180, h: 20 },
      { x: 800, y: 180, w: 140, h: 20 },
      { x: 160, y: 260, w: 120, h: 20 },
    ],
    slimeSpawns: [
      [420, 380],
      [700, 200],
      [820, 380],
    ],
    rangedSpawns: [
      [500, 380],
      [600, 380],
      [760, 200],
    ],
    heavySpawns: [
      [900, 368],
    ],
  },

  ruins: {
    displayName: 'Sunken Ruins',
    bg:         '#12121c',
    // Slightly heavier mid/far, cooler void (still bg-only; platforms unchanged)
    parallaxTuning: {
      desatAdd:  [0.04, 0.02, 0.01],
      darkenAdd: [0.04, 0.02, 0.02],
    },
    levelW:     CANVAS_W * 2,
    levelH:     CANVAS_H,
    spawn:      { x: 100, y: 300 },
    platforms:  [
      { x: 0,   y: 400, w: CANVAS_W * 2, h: 140 },
      { x: 220, y: 300, w: 140, h: 20 },
      { x: 480, y: 220, w: 200, h: 20 },
      { x: 720, y: 320, w: 100, h: 90 },
      { x: 880, y: 200, w: 160, h: 20 },
    ],
    slimeSpawns: [
      [400, 360],
      [620, 180],
      [900, 160],
    ],
    rangedSpawns: [
      [340, 360],
      [760, 360],
    ],
    heavySpawns: [
      [520, 348],
      [940, 148],
    ],
  },

  cave: {
    displayName: 'Deep Cavern',
    bg:         '#0a0e14',
    // Darkest, most desaturated: push depth to back; foreground reads forward
    parallaxTuning: {
      desatAdd:  [0.06, 0.05, 0.03],
      darkenAdd: [0.08, 0.05, 0.02],
    },
    levelW:     CANVAS_W * 2,
    levelH:     CANVAS_H,
    spawn:      { x: 80, y: 280 },
    platforms:  [
      { x: 0,   y: 430, w: CANVAS_W * 2, h: 110 },
      { x: 200, y: 360, w: 100, h: 20 },
      { x: 400, y: 280, w: 120, h: 20 },
      { x: 600, y: 200, w: 200, h: 20 },
      { x: 360, y: 160, w: 100, h: 20 },
      { x: 800, y: 340, w: 120, h: 20 },
    ],
    slimeSpawns: [
      [450, 400],
      [700, 240],
      [300, 320],
      [900, 380],
    ],
    rangedSpawns: [
      [420, 380],
      [540, 380],
      [860, 300],      
    ],
    heavySpawns: [
      [220, 318],
      [680, 360],
      [900, 380],
    ],
  },
};

export function getZoneConfig(id) {
  return ZONES[id] ?? ZONES[ZONE_ORDER[0]];
}

export function getNextZoneId(id) {
  const i = ZONE_ORDER.indexOf(id);
  if (i < 0 || i >= ZONE_ORDER.length - 1) return null;
  return ZONE_ORDER[i + 1];
}

export function isLastZone(id) {
  return id === ZONE_ORDER[ZONE_ORDER.length - 1];
}
