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
 * @property {number} multX 0..1 scroll factor vs camera X
 * @property {number} multY 0..1 scroll factor vs camera Y
 * @property {number} opacity layer alpha (stacked over screen base, source-over)
 * @property {number} desat 0..1 mix toward gray (readability: keep high on far)
 * @property {number} darken 0..1 extra darken (multiplier on channel after desat)
 * @property {number} horizonY gradient horizon position 0..1 of level height
 */

/** Default three world layers: far sky → mid air → near ground haze (placeholders for PNGs). */
export const PARALLAX_LAYERS = [
  {
    id:   'far',
    multX: 0.14,
    multY: 0.04,
    /** Receded vs gameplay: lower opacity, more darken so world reads in front */
    opacity: 0.42,
    desat:  0.74,
    darken: 0.3,
    horizonY: 0.48,
  },
  {
    id:   'mid',
    multX: 0.48,
    multY: 0.10,
    opacity: 0.4,
    desat:  0.55,
    darken: 0.2,
    horizonY: 0.42,
  },
  {
    id:   'near',
    multX: 0.82,
    multY: 0.16,
    opacity: 0.32,
    desat:  0.4,
    darken: 0.12,
    horizonY: 0.38,
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
