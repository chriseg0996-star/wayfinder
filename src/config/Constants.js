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

// --- Player movement ---
export const PLAYER_SPEED     = 280;    // px/s
export const AIR_CONTROL      = 0.7;    // multiplier (0=none, 1=full)
export const FRICTION_GROUND  = 0.0;    // not used — instant stop feels better
export const PLAYER_W         = 28;
export const PLAYER_H         = 48;

// --- Jump ---
export const JUMP_FORCE       = 720;    // initial vy px/s (negative = up)
export const JUMP_CUT_FACTOR  = 0.4;    // vy multiplied when jump released early
export const COYOTE_TIME      = 0.10;   // seconds after leaving edge
export const JUMP_BUFFER_TIME = 0.12;   // seconds jump input is buffered

// --- Dodge ---
export const DODGE_SPEED      = 600;    // px/s
export const DODGE_DURATION   = 0.22;   // seconds
export const DODGE_IFRAMES    = 0.18;   // seconds of invincibility
export const DODGE_COOLDOWN   = 0.55;   // seconds

// --- Combat — player ---
export const COMBO_HITS         = 3;
export const COMBO_WINDOW       = 0.5;    // seconds to chain next hit
export const ATTACK_DURATION    = [0.20, 0.20, 0.32]; // seconds per hit
export const ATTACK_ACTIVE      = [0.06, 0.06, 0.10]; // active hitbox window
export const ATTACK_DAMAGE      = [8, 10, 18];
export const ATTACK_KNOCKBACK   = [180, 200, 380];
export const ATTACK_RANGE_W     = 52;
export const ATTACK_RANGE_H     = 36;
export const HITSTOP_DURATION   = 0.06;  // seconds both entities freeze

// --- Player stats ---
export const PLAYER_MAX_HP      = 100;

// --- Enemy — slime ---
export const SLIME_W              = 32;
export const SLIME_H              = 24;
export const SLIME_MAX_HP         = 30;
export const SLIME_PATROL_SPEED   = 60;
export const SLIME_CHASE_SPEED    = 130;
export const SLIME_CHASE_RANGE    = 220;
export const SLIME_ATTACK_RANGE   = 52;
export const SLIME_TELEGRAPH_DUR  = 0.55;  // windup before attack
export const SLIME_ATTACK_DUR     = 0.30;
export const SLIME_ATTACK_DAMAGE  = 12;
export const SLIME_KNOCKBACK      = 260;
export const SLIME_HURT_DUR       = 0.25;
export const SLIME_PATROL_TURN    = 2.5;   // seconds before reversing patrol

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
