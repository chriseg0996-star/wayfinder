// ============================================================
// Art pipeline constants — no gameplay logic.
// Parallax: lower multX = farther (slower). Gameplay = 1.0.
// See docs/STYLE_BIBLE.md, assets/README.md
// ============================================================

/** Integer pixel size for environment / character art authored on grid. */
export const GRID_PX = 16;

/**
 * @typedef {object} ParallaxLayerDef
 * @property {string} id
 * @property {string} role  sky | midground | nearScenery (for art/docs)
 * @property {string} [label] human copy e.g. "Mountains" for placeholder gradients
 * @property {number} multX 0..1 scroll factor vs camera X (lower = slower / farther)
 * @property {number} multY 0..1 scroll factor vs camera Y
 * @property {number} opacity layer alpha (stacked over screen base, source-over)
 * @property {number} desat 0..1 mix toward gray
 * @property {number} darken 0..1 after desat
 * @property {number} [contrastPull] 0..1 luma-squeeze; lowers local contrast in bg
 * @property {number} horizonY 0..1 of level height: gradient "ridge" in band
 */

/** 3 world layers, back→front. Placeholder = gradients; swap in PNGs per layer later. */
export const PARALLAX_LAYERS = [
  {
    id:    'far',
    role:  'sky',
    label: 'sky',
    multX: 0.2,
    multY: 0.03,
    opacity: 0.36,
    desat:  0.8,
    darken: 0.32,
    contrastPull: 0.12,
    horizonY: 0.52,
  },
  {
    id:    'mid',
    role:  'midground',
    label: 'mountains & trees',
    multX: 0.5,
    multY: 0.11,
    opacity: 0.33,
    desat:  0.62,
    darken: 0.22,
    contrastPull: 0.1,
    horizonY: 0.4,
  },
  {
    id:    'near',
    role:  'nearScenery',
    label: 'foreground scenery',
    multX: 0.8,
    multY: 0.18,
    opacity: 0.28,
    desat:  0.5,
    darken: 0.16,
    contrastPull: 0.08,
    horizonY: 0.32,
  },
];

/**
 * When zone config has `parallaxTuning`, add these deltas to desat/darken per layer index
 * (same order as PARALLAX_LAYERS) for mood without new assets.
 */
export const DEFAULT_PARALLAX_TUNING = {
  /** Added to desat 0..1 (clamp in render) */
  desatAdd:  [0, 0, 0],
  /** Added to darken 0..1 */
  darkenAdd: [0, 0, 0],
};

/**
 * Suggested: canvas game pixels per authored art pixel when up-scaling 16px tiles.
 */
export const RECOMMENDED_ART_SCALE = 2;

/** Draw pass order: screen → parallax[far..near] → world 1:1. */
export const DRAW = {
  screenBase:   0,
  parallaxFar:  1,
  parallaxMid:  2,
  parallaxNear: 3,
  platforms:    4,
  entities:     5,
  fx:           6,
};

/** Legacy — kept for one-line tools; use PARALLAX_LAYERS[n].multX for “back” */
export const PARALLAX = {
  backX: PARALLAX_LAYERS[0].multX,
  backY: PARALLAX_LAYERS[0].multY,
};
