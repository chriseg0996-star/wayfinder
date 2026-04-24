// ============================================================
// WAYFINDER — Constants.js
// ALL tunable gameplay values live here. Never hardcode elsewhere.
// ============================================================

// --- Loop ---
export const TICK_RATE   = 60;
export const FIXED_DT    = 1 / TICK_RATE;

// --- Canvas ---
export const CANVAS_W    = 960;
export const CANVAS_H    = 540;

// --- Background & parallax (render only; not gameplay) ---
// Draw pass: Render.js → drawScreenBase (screen-locked) → drawParallaxStack (world) → 1:1 world + entities.
//
// *Layer structure* (back → front), implemented in `src/render/backgroundLayers.js` from
//   `src/render/artConfig.js` `PARALLAX_LAYERS` (single source to tune mults / per-layer opacity):
//   [0] far  — “sky” band; lowest multX / multY = slowest drift (deepest)
//   [1] mid  — midground band; middle mults
//   [2] near — nearest band; highest mults (still < 1; gameplay + platforms scroll at 1.0)
// Each layer: vertical gradient + desat / darken / contrastPull so tiles & actors read in front.
//
// *Current* PARALLAX_LAYERS (tune in artConfig; duplicate numbers here for quick reference only):
//   far:  multX=0.10, multY=0.03, base opacity≈0.36
//   mid:  multX=0.40, multY=0.11, base opacity≈0.33
//   near: multX=0.68, multY=0.18, base opacity≈0.28
// Effective alpha per layer = `opacity` × `READABILITY_PARALLAX_OPACITY_MULT` (global dim, below).
//
// *Per-zone* mood: `data/zones.js` optional `parallaxTuning` — `desatAdd` / `darkenAdd` length-3
//   arrays for [far, mid, near], stacked on DEFAULT_PARALLAX_TUNING in artConfig. Zone `bg` tints the gradients.

// --- Physics ---
export const GRAVITY          = 2200;   // px/s²
export const MAX_FALL_SPEED   = 1400;   // px/s

// --- Player movement (horizontal) ---
// Max run speed; acceleration ramps vx toward this value on ground and in air.
export const PLAYER_SPEED     = 300;    // px/s (max)
export const AIR_CONTROL      = 0.75;  // 0=none, 1=full: scales max air speed
export const PLAYER_GROUND_ACCEL   = 2600;  // px/s² toward target
export const PLAYER_GROUND_TURN_MULT = 2.4;   // accel multiplier when reversing on ground
export const PLAYER_GROUND_DECEL   = 3800;  // px/s² to 0 when no horizontal input
export const PLAYER_AIR_ACCEL      = 2000;  // px/s² in air
export const PLAYER_AIR_TURN_MULT  = 2.0;   // faster reverse in air
export const PLAYER_AIR_DRAG      = 550;  // px/s² toward 0 when no air input
export const PLAYER_W         = 28;
export const PLAYER_H         = 48;
/** Render-only scale on player sprite draw size (physics/hitbox stay on PLAYER_W/H). */
export const PLAYER_RENDER_SCALE = 1.5; // tune 1.5..2.0

// --- Jump ---
export const JUMP_FORCE        = 760;  // initial |vy| px/s
export const JUMP_CUT_MULTIPLIER = 0.5;  // on release, vy *= this, once per jump (0–1; lower = shorter hop)
// Gravity multipliers: applied to player only (enemies use base GRAVITY).
export const JUMP_RISE_GRAVITY_MULT  = 0.78;  // <1 = floatier rise
export const JUMP_FALL_GRAVITY_MULT  = 1.1;  // >1 = snappier landings
export const COYOTE_TIME      = 0.12;   // seconds after leaving ledge, still can jump
export const JUMP_BUFFER_TIME = 0.15;   // seconds to buffer jump

// --- Dodge (buffer: hold dodge brief window; fires when cooldown/attack allow) ---
export const DODGE_BUFFER_TIME  = 0.14; // seconds, mirrors jump buffer feel
export const DODGE_SPEED      = 650;   // px/s
export const DODGE_DURATION   = 0.2;  // seconds
export const DODGE_IFRAMES  = 0.18;   // seconds
export const DODGE_COOLDOWN = 0.5;  // seconds

// --- Combat — player melee (per hit index: startup → active → recovery) ---
export const COMBO_HITS          = 3;
export const COMBO_WINDOW        = 0.48;   // seconds to chain to next hit after an attack *starts*
export const ATTACK_STARTUP      = [0.05, 0.05, 0.08];  // no hitbox
export const ATTACK_ACTIVE       = [0.06, 0.06, 0.10];  // hitbox on
export const ATTACK_RECOVERY     = [0.09, 0.09, 0.14];  // hitbox off, no new neutral attack
// Total per hit = startup+active+recovery = [0.2, 0.2, 0.32] (must match design)
/**
 * Per-step attack length (s), one entry per hit index — same totals Player.js uses for `attackTimer`.
 * animClips: one-shot t = 1 - attackTimer / PLAYER_ATTACK_STEP_TOTAL_SEC[ci].
 * @type {readonly [number, number, number]}
 */
export const PLAYER_ATTACK_STEP_TOTAL_SEC = [
  ATTACK_STARTUP[0] + ATTACK_ACTIVE[0] + ATTACK_RECOVERY[0],
  ATTACK_STARTUP[1] + ATTACK_ACTIVE[1] + ATTACK_RECOVERY[1],
  ATTACK_STARTUP[2] + ATTACK_ACTIVE[2] + ATTACK_RECOVERY[2],
];
export const ATTACK_DAMAGE        = [8, 10, 18];
export const ATTACK_KNOCKBACK     = [180, 200, 380];
export const ATTACK_RANGE_W      = 52;
export const ATTACK_RANGE_H      = 36;
// After an attack *fully ends* (idle), min time before starting a new combo (anti-mash)
export const ATTACK_MIN_INTERVAL  = 0.14;  // seconds
export const HITSTOP_DURATION    = 0.058; // global freeze; tune for “impact”
export const SHAKE_MAX_OFFSET    = 5;     // px max camera shake offset (reduced)
export const SHAKE_DECAY         = 20;    // shake power decay / second (faster settle)
export const SHAKE_POWER_LIGHT   = 0.30;  // light hit
export const SHAKE_POWER_STRONG  = 0.55;  // heavy hit / ability impact
export const SHAKE_POWER_KILL    = 0.75;  // kill confirmation pop
export const HIT_VFX_LIFE        = 0.12;  // seconds per impact burst
export const HIT_VFX_MAX         = 24;    // safety cap for transient queue

// --- Player abilities (simple cooldown kit) ---
// 1) Mobility: Burst Step
export const ABILITY_MOVE_CD      = 3.4;
export const ABILITY_MOVE_DUR     = 0.16;
export const ABILITY_MOVE_SPEED   = 740;
export const ABILITY_MOVE_IFRAMES = 0.14;
// 2) Damage: Arc Burst
export const ABILITY_DAMAGE_CD    = 4.6;
export const ABILITY_DAMAGE_DAMAGE= 16;
export const ABILITY_DAMAGE_W     = 84;
export const ABILITY_DAMAGE_H     = 52;
// 3) Control/Defensive: Guard Pulse
export const ABILITY_GUARD_CD     = 6.0;
export const ABILITY_GUARD_DUR    = 0.32;
export const ABILITY_GUARD_RADIUS = 74;
export const ABILITY_GUARD_KB     = 360;

// Vertical pop on slimes from player hits (separate from horizontal KB)
export const ENEMY_ON_HIT_KB_Y    = -200;

// --- Progression (Phase 2) ---
export const XP_PER_SLIME_KILL   = 40;
export const XP_TO_NEXT_BASE     = 80;   // level 1 bar to reach level 2
export const XP_TO_NEXT_PER_LEVEL= 45;   // added per level
// STR: melee mult; VIT: max HP mult; AGI: move speed mult
export const STAT_DMG_PER_STR    = 0.03;
export const STAT_VIT_MAX_HP     = 0.04;
export const STAT_AGI_MOVE       = 0.018;

// --- Player stats (hurt from enemies — pipeline) ---
export const PLAYER_MAX_HP       = 100;
export const PLAYER_HURT_DUR     = 0.35;   // seconds in hurt state
export const PLAYER_HURT_IFRAMES  = 0.58;  // iframes after taking a hit

// --- Enemy — slime ---
export const SLIME_W              = 32;
export const SLIME_H              = 24;
/** Render-only scale on slime sprite draw size (physics/hitbox stay on SLIME_W/H). */
export const SLIME_RENDER_SCALE   = 1.15;
export const SLIME_MAX_HP         = 30;
export const SLIME_PATROL_SPEED   = 60;
export const SLIME_CHASE_SPEED    = 130;
export const SLIME_CHASE_RANGE    = 220;
export const SLIME_ATTACK_RANGE   = 52;  // start telegraph at this x gap
export const SLIME_TELEGRAPH_DUR  = 0.42;  // clear windup before damage
export const SLIME_ATTACK_DUR     = 0.28; // follow-through after hit frame
export const SLIME_ATTACK_DAMAGE  = 12;
export const SLIME_KNOCKBACK      = 255;
// Vertical on player; horizontal bite uses SLIME_KNOCKBACK
export const SLIME_KNOCKUP        = -255;
// --- Slime melee validation (damage only; AI detect/telegraph stays on SLIME_ATTACK_RANGE) ---
// Actual bite connect in Combat: forward hitbox reach from slime body.
export const SLIME_MELEE_REACH    = SLIME_ATTACK_RANGE + 14;
// Same-combat-plane feet tolerance. Prevents bites through higher/lower platforms.
export const SLIME_MELEE_FEET_Y_TOL = 18;
// Vertical expansion around slime body for overlap test (for slopes / mild offsets).
export const SLIME_MELEE_Y_PAD = 10;
export const SLIME_HURT_DUR        = 0.28; // stunned after player hit
export const SLIME_PATROL_TURN     = 2.5;   // seconds before reversing patrol
// Resume chasing after this far (hysteresis vs SLIME_CHASE_RANGE)
export const SLIME_LOSE_CHASE_MULT = 1.38;

// --- Enemy — ranged (simple keep-distance + telegraph + projectile) ---
export const RANGED_W               = 24;
export const RANGED_H               = 40;
/** Render-only scale on ranged sprite draw size (physics/hitbox stay on RANGED_W/H). */
export const RANGED_RENDER_SCALE    = 2.175;
/** Render-only positional nudge for ranged sprite anchoring. */
export const RANGED_SPRITE_OFFSET_X = 0;
export const RANGED_SPRITE_OFFSET_Y = 2;
export const RANGED_MAX_HP          = 20;
export const RANGED_AGGRO_RANGE     = 340;
export const RANGED_KEEP_MIN        = 130;
export const RANGED_KEEP_MAX        = 210;
export const RANGED_MOVE_SPEED      = 88;
export const RANGED_TELEGRAPH_DUR   = 0.30;
export const RANGED_SHOT_COOLDOWN   = 1.15;
export const RANGED_PROJECTILE_W    = 12;
export const RANGED_PROJECTILE_H    = 8;
export const RANGED_PROJECTILE_SPEED= 300;
export const RANGED_PROJECTILE_LIFE = 2.2;
export const RANGED_PROJECTILE_DAMAGE = 7;

// --- Enemy — heavy charger (commits, then punishable) ---
export const HEAVY_W                = 40;
export const HEAVY_H                = 52;
/** Render-only scale on heavy sprite draw size (physics/hitbox stay on HEAVY_W/H). */
export const HEAVY_RENDER_SCALE     = 2.0;
/** Render-only positional nudge for heavy sprite anchoring. */
export const HEAVY_SPRITE_OFFSET_X  = 0;
export const HEAVY_SPRITE_OFFSET_Y  = 2;
export const HEAVY_MAX_HP           = 72;
export const HEAVY_AGGRO_RANGE      = 300;
export const HEAVY_MOVE_SPEED       = 68;
export const HEAVY_TRIGGER_RANGE    = 110;
export const HEAVY_TELEGRAPH_DUR    = 0.45;
export const HEAVY_CHARGE_SPEED     = 430;
export const HEAVY_CHARGE_DUR       = 0.34;
export const HEAVY_RECOVER_DUR      = 0.65;
export const HEAVY_COOLDOWN         = 1.35;
export const HEAVY_DAMAGE           = 18;
export const HEAVY_KNOCKBACK        = 320;
export const HEAVY_KNOCKUP          = -220;

// --- Encounter micro-rules (anti-unfair overlap, no new framework) ---
export const ENCOUNTER_ARCHER_TELEGRAPH_MAX = 2;
export const ENCOUNTER_ARCHER_DIRECTLINE_MAX = 2;
export const ENCOUNTER_BRUTE_ATTACK_MAX_BY_ZONE = {
  forest: 1,
  ruins: 2,
  cave: 2,
};
export const ENCOUNTER_BRUTE_TELEGRAPH_GAP_SEC = 0.6;

// --- Slime: AI FSM `e.state` (Enemy.js) → animation clip (SLIME_ANIM) =====================
// getSlimeAnimKey (render/animKeys.js) + resolveSlimeTextureRect (render/animClips.js) + entityRender.
//
// | AI e.state  | Motion (Enemy)              | Clip key  | Playback | One-shot / loop wall   |
// |------------|-----------------------------|-----------|----------|-------------------------|
// | patrol     | walk patrolDir              | idle      | loop     | —                       |
// | chase      | run toward player           | move      | loop     | —                       |
// | telegraph  | still; timer → attack       | telegraph | loop†    | — (AI wall SLIME_TELEGRAPH_DUR) |
// | attack     | still; timer → patrol       | attack    | one-shot | SLIME_ATTACK_DUR, e.attackTimer |
// | hurt       | telegraph+attack cleared    | hurt      | one-shot | SLIME_HURT_DUR, e.hurtTimer     |
// | (not AI)   | !e.alive + deathStartTick  | death     | one-shot | row duration; see animClips   |
// † `telegraph` row loops while the **telegraph gizmo** (SLIME_TEL_*, entityRender) reads as wind-up
//   for SLIME_TELEGRAPH_DUR — visually distinct from `attack` (no gizmo, different clip row + timer).
// Death: not an e.state; Combat sets deathStartTick; AI update skips e.alive.

/**
 * @type {Readonly<Record<string, 'idle'|'move'|'telegraph'|'attack'|'hurt'>>}
 */
export const SLIME_AI_TO_ANIM = {
  patrol:    'idle',
  chase:     'move',
  telegraph: 'telegraph',
  attack:    'attack',
  hurt:      'hurt',
};

// Telegraph gizmo: drawn only in telegraph (entityRender) — before sprite so slime stays on top;
// pad/larger pulse/stroke make wind-up read clearly vs chase (green) and attack (no box).
export const SLIME_TEL_PAD_PX  = 22;
export const SLIME_TEL_PULSE   = { min: 0.62, range: 0.35 };
export const SLIME_TEL_SINE    = 0.24; // telegraph pulse read vs static chase
export const SLIME_TEL_FONT    = 'bold 18px monospace';

// --- Camera ---
export const CAM_LEAD_X      = 80;    // px ahead of player
export const CAM_LERP        = 6.0;   // higher = snappier
export const CAM_DEADZONE_Y  = 60;    // px vertical deadzone

// --- 2D sprite / sheet (Phase 2— sprite pipeline; assets/sprites/*.png) ---
// Layout: (sx, sy) = (frameIndex * frameW, row * frameH) in sheet pixels; flipX in drawImageFrame.
//
// ===== Player: gameplay FSM → animation clip (PLAYER_ANIM row keys) ======================
// Sim owns `p.state` + timers in Player.js / Combat; render maps to clips via getPlayerAnimKey
// (render/animKeys.js) + resolvePlayerTextureRect (render/animClips.js). No duplicate timing here.
//
// | Gameplay (p.state + fields)     | Clip key   | Playback | One-shot wall (sec)   |
// |----------------------------------|------------|----------|------------------------|
// | idle — grounded, |vx| ≤ LOCO*   | idle       | loop     | —                      |
// | run — grounded, |vx| > LOCO*    | run        | loop     | —                      |
// | jump — !grounded, vy < 0        | jump       | loop     | —                      |
// | fall — !grounded, vy ≥ 0        | fall       | loop     | —                      |
// | attack + comboIndex 1 / 2 / 3   | attack_1/2/3| one-shot| PLAYER_ATTACK_STEP_…[i]|
// | dodge                           | dodge      | one-shot | DODGE_DURATION         |
// | hurt                            | hurt       | one-shot | PLAYER_HURT_DUR        |
// | dead or hp ≤ 0**                | idle (row) | loop†    | —                      |
// *PLAYER_LOCO_RUN_VX. **FSM 'dead' → same clip key as idle until a death row exists.
// † Renders as idle row; FSM is still 'dead' (no locomotion).
//
// One-shots: clip progress t comes from the same timers Player uses (attackTimer, dodgeTimer, hurtTimer);
//   PLAYER_ANIM `fps` is only how many draw frames are spread across that wall.
// Loops: spriteLoopFrameIndex(state.tick, spec) in Constants (uses tick * FIXED_DT internally).
// Phase 2 art contract: player.png row indices + frame counts must match PLAYER_ANIM.
/**
 * @typedef {{ row: number, frames: number, fps: number, mode: 'loop' | 'oneShot' }} SpriteRow
 */
export const PLAYER_SHEET_PX  = { frameW: 32, frameH: 48 };
export const SLIME_SHEET_PX   = { frameW: 32, frameH: 24 };
export const ARCHER_SHEET_PX  = { frameW: 32, frameH: 48 };
export const BRUTE_SHEET_PX   = { frameW: 32, frameH: 48 };

// Locomotion labels: only `idle` vs `run` on ground; jump vs `fall` in air.
// Tunes when we call it `run` for animation, not max speed (physics unchanged).
export const PLAYER_LOCO_RUN_VX = 1; // px/s: grounded and |vx| > this => run, else idle

/**
 * @type {Record<string, SpriteRow>}
 * Keys line up with getPlayerAnimKey; row order in player.png = 0..8 top to bottom.
 */
export const PLAYER_ANIM = {
  idle:     { row: 0, frames: 4, fps: 5,  mode: 'loop' },
  run:      { row: 1, frames: 6, fps: 8,  mode: 'loop' },
  jump:     { row: 2, frames: 3, fps: 4,  mode: 'loop' },
  fall:     { row: 3, frames: 3, fps: 4,  mode: 'loop' },
  attack_1: { row: 4, frames: 3, fps: 12, mode: 'oneShot' },
  attack_2: { row: 5, frames: 3, fps: 12, mode: 'oneShot' },
  attack_3: { row: 6, frames: 3, fps: 10, mode: 'oneShot' },
  dodge:    { row: 7, frames: 2, fps: 10, mode: 'oneShot' },
  hurt:     { row: 8, frames: 2, fps: 8,  mode: 'oneShot' },
};

/**
 * One row per clip key; keys match `SLIME_AI_TO_ANIM` + `death` (combat, not AI).
 * `telegraph` row: loops during AI state `telegraph` — pair with gizmo (Constants SLIME_TEL_*) for read.
 * @type {Record<string, SpriteRow>}
 */
export const SLIME_ANIM = {
  idle:      { row: 0, frames: 2, fps: 4, mode: 'loop' },
  move:      { row: 1, frames: 4, fps: 6, mode: 'loop' },
  telegraph: { row: 2, frames: 2, fps: 6, mode: 'loop' },
  attack:    { row: 3, frames: 3, fps: 8, mode: 'oneShot' },
  hurt:      { row: 4, frames: 2, fps: 6, mode: 'oneShot' },
  death:     { row: 5, frames: 4, fps: 6, mode: 'oneShot' },
};

/**
 * Ranged enemy (archer) sprite rows.
 * Uses telegraph timer/cooldown in animClips for one-shots.
 * @type {Record<string, SpriteRow>}
 */
export const ARCHER_ANIM = {
  idle:  { row: 0, frames: 4, fps: 5, mode: 'loop' },
  move:  { row: 1, frames: 7, fps: 7, mode: 'loop' },
  aim:   { row: 2, frames: 3, fps: 8, mode: 'oneShot' },
  shoot: { row: 3, frames: 6, fps: 12, mode: 'oneShot' },
  hurt:  { row: 4, frames: 3, fps: 8, mode: 'oneShot' },
  death: { row: 5, frames: 7, fps: 8, mode: 'oneShot' },
};

/**
 * Heavy enemy (brute) sprite rows.
 * @type {Record<string, SpriteRow>}
 */
export const BRUTE_ANIM = {
  idle:   { row: 0, frames: 4, fps: 4, mode: 'loop' },
  move:   { row: 1, frames: 6, fps: 6, mode: 'loop' },
  attack: { row: 2, frames: 6, fps: 8, mode: 'oneShot' },
  hurt:   { row: 3, frames: 3, fps: 7, mode: 'oneShot' },
  death:  { row: 4, frames: 6, fps: 6, mode: 'oneShot' },
};

/** One cell = one frame duration in seconds. */
export function spriteFrameDurationSec(/** @type {SpriteRow} */ spec) {
  if (!spec || !spec.fps) {
    return 0;
  }
  return 1 / spec.fps;
}

/**
 * Wall time for a one-shot that plays the whole row at `fps` (slime death).
 * @param {SpriteRow} spec
 */
export function spriteClipDurationOneShotSec(spec) {
  if (!spec || spec.frames < 1) {
    return 0;
  }
  return spec.frames / spec.fps;
}

/**
 * Looping row: frame from global sim `tick` at TICK_RATE.
 * @param {number} tick
 * @param {SpriteRow} spec
 */
export function spriteLoopFrameIndex(tick, spec) {
  if (!spec || spec.mode !== 'loop' || spec.frames < 1) {
    return 0;
  }
  const tSec = tick * FIXED_DT;
  const idx  = Math.floor(tSec * spec.fps) % spec.frames;
  return Math.max(0, Math.min(spec.frames - 1, idx));
}

/**
 * One-shot: t in [0,1] → frame index (inclusive end = last frame).
 * @param {number} t
 * @param {number} frameCount
 */
export function spriteOneShotFrameIndex(t, frameCount) {
  if (frameCount < 1) {
    return 0;
  }
  const tc = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return Math.min(frameCount - 1, Math.max(0, Math.floor(tc * frameCount)));
}

// --- Colors (placeholder art palette) ---
export const COLOR_BG        = '#0d1117';
// Slightly lifted vs parallax; rim + outline + optional ground shadow in Render
export const COLOR_PLATFORM  = '#5e7287';
/** Top 2px highlight on colliders — separates gameplay layer from parallax */
export const COLOR_PLATFORM_RIM   = '#7a8fa5';
/** Thin bottom band — grounds platform face */
export const COLOR_PLATFORM_SHADE = '#3d4b5c';
export const COLOR_PLAYER    = '#5ec8f0';
export const COLOR_PLAYER_ATK= '#fff176';
export const COLOR_SLIME     = '#6bcc6e';
export const COLOR_SLIME_HIT = '#f5a8a8';
export const COLOR_SLIME_TEL = '#ffc940'; // warm amber: telegraph read vs body + bg
export const COLOR_HP_BG     = '#1a1a2e';
export const COLOR_HP_BAR    = '#e53935';
export const COLOR_HP_FILL   = '#43a047';
export const COLOR_IFRAME    = 'rgba(100,200,255,0.22)';
export const COLOR_DEBUG_BG  = 'rgba(0,0,0,0.72)';
export const COLOR_DEBUG_TEXT= '#b0bec5';

// --- Readability (render only; entityRender + backgroundLayers) ---
/**
 * Global scale on each parallax layer’s `opacity` in artConfig (source-over stack).
 * Lower = quieter backgrounds vs. gameplay (platforms, entities, rim/outline unchanged).
 * Typical: 0.58–0.72
 */
export const READABILITY_PARALLAX_OPACITY_MULT = 0.62;
/** Silhouette stroke on blitted player sprite (entityRender) */
export const READABILITY_PLAYER_STROKE = { w: 2.5, color: 'rgba(0, 1, 6, 0.95)' };
/** Ellipse under feet — separates actor from parallax (entityRender) */
export const READABILITY_PLAYER_SHADOW = {
  halfWMult: 0.62,
  ry:        7,
  offsetY:   1,
  color:     'rgba(0, 0, 0, 0.52)',
};
/** Silhouette on slime sprite (entityRender) */
export const READABILITY_SLIME_STROKE = { w: 2, color: 'rgba(2, 4, 12, 0.9)' };
export const READABILITY_SLIME_SHADOW = {
  halfWMult: 0.55,
  ry:        5,
  offsetY:   1,
  color:     'rgba(0, 0, 0, 0.46)',
};
/** Telegraph gizmo — outer stroke (entityRender) */
export const READABILITY_TEL_STROKE = { w: 4.5, color: 'rgba(255, 130, 20, 0.98)' };
/** Telegraph — underpaint behind amber pulse (entityRender) */
export const READABILITY_TEL_INNER_DARK = 'rgba(6, 2, 0, 0.5)';
/** Collider stroke — Render.js platforms */
export const READABILITY_PLATFORM_OUTLINE = { w: 1.25, color: 'rgba(4, 6, 10, 0.78)' };
/**
 * Contact strip under platform bottom (world space, Render.js); grounds slab vs soft bg.
 * @type {{ h: number, inset: number, color: string }}
 */
export const READABILITY_PLATFORM_GROUND_SHADOW = {
  h:     3,
  inset: 4,
  color: 'rgba(0, 0, 0, 0.26)',
};

// --- Round / UI copy (end-of-round overlays) ---
export const UI_LOSE_TITLE       = 'You died';
export const UI_LOSE_SUB         = 'Press R to try again';
export const UI_WIN_TITLE        = 'Cleared';
export const UI_WIN_SUB_NEXT     = 'N — next area   ·   R — new run';
export const UI_WIN_SUB_FINALE   = 'R — new run  ·  all zones cleared';
export const COLOR_OVERLAY_BG    = 'rgba(13, 17, 23, 0.85)';
export const COLOR_OVERLAY_TITLE = '#eceff1';
export const COLOR_OVERLAY_SUB   = '#90a4ae';
