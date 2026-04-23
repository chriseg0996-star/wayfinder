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
export const ATTACK_DAMAGE        = [8, 10, 18];
export const ATTACK_KNOCKBACK     = [180, 200, 380];
export const ATTACK_RANGE_W      = 52;
export const ATTACK_RANGE_H      = 36;
// After an attack *fully ends* (idle), min time before starting a new combo (anti-mash)
export const ATTACK_MIN_INTERVAL  = 0.14;  // seconds
export const HITSTOP_DURATION    = 0.058; // global freeze; tune for “impact”

// Vertical pop on slimes from player hits (separate from horizontal KB)
export const ENEMY_ON_HIT_KB_Y    = -200;

// --- Player stats (hurt from enemies — pipeline) ---
export const PLAYER_MAX_HP       = 100;
export const PLAYER_HURT_DUR     = 0.35;   // seconds in hurt state
export const PLAYER_HURT_IFRAMES  = 0.58;  // iframes after taking a hit

// --- Enemy — slime ---
export const SLIME_W              = 32;
export const SLIME_H              = 24;
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
// Bite connect: |dx| between roots must be under this
export const SLIME_MELEE_REACH    = SLIME_ATTACK_RANGE + 14;
export const SLIME_HURT_DUR        = 0.28; // stunned after player hit
export const SLIME_PATROL_TURN     = 2.5;   // seconds before reversing patrol
// Resume chasing after this far (hysteresis vs SLIME_CHASE_RANGE)
export const SLIME_LOSE_CHASE_MULT = 1.38;

// --- Camera ---
export const CAM_LEAD_X      = 80;    // px ahead of player
export const CAM_LERP        = 6.0;   // higher = snappier
export const CAM_DEADZONE_Y  = 60;    // px vertical deadzone

// --- Colors (placeholder art palette) ---
export const COLOR_BG        = '#0d1117';
export const COLOR_PLATFORM  = '#3a4a5c';
export const COLOR_PLAYER    = '#4fc3f7';
export const COLOR_PLAYER_ATK= '#fff176';
export const COLOR_SLIME     = '#66bb6a';
export const COLOR_SLIME_HIT = '#ef9a9a';
export const COLOR_SLIME_TEL = '#ffcc02';
export const COLOR_HP_BG     = '#1a1a2e';
export const COLOR_HP_BAR    = '#e53935';
export const COLOR_HP_FILL   = '#43a047';
export const COLOR_IFRAME    = 'rgba(100,200,255,0.18)';
export const COLOR_DEBUG_BG  = 'rgba(0,0,0,0.72)';
export const COLOR_DEBUG_TEXT= '#b0bec5';

// --- Round / UI copy (Phase 1 loop) ---
export const UI_GOAL_LINE        = 'Defeat all slimes';
export const UI_LOSE_TITLE       = 'You died';
export const UI_LOSE_SUB         = 'Press R to try again';
export const UI_WIN_TITLE        = 'Cleared';
export const UI_WIN_SUB          = 'Press R to play again';
export const COLOR_OVERLAY_BG    = 'rgba(13, 17, 23, 0.85)';
export const COLOR_OVERLAY_TITLE = '#eceff1';
export const COLOR_OVERLAY_SUB   = '#90a4ae';
