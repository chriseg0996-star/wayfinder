// ============================================================
// WAYFINDER — GameState.js
//
// **In-memory (full sim):** `state` is plain data — no methods, no DOM/canvas/ctx
// (canvas lives on `Game` in Game.js). Per-tick / engine fields may use the `_` prefix
// (e.g. `player._gravityScale`, `enemies[]._hitThisSwing`).
//
// **Wire / JSON snapshot** — `getSerializableGameState()` in `serializeGameState.js`
// returns a *durable* slice: strips all `_*` keys, then drops FSM, buffers, and timers
// listed there (root `hitstop` / `debug`, player and enemy transients). A future
// `loadFromSnapshot()` could re-derive in-air FSM from position/zone if needed.
// ============================================================

import {
  PLAYER_MAX_HP, PLAYER_W, PLAYER_H,
  SLIME_MAX_HP, SLIME_W, SLIME_H,
  RANGED_MAX_HP, RANGED_W, RANGED_H,
  HEAVY_MAX_HP, HEAVY_W, HEAVY_H,
  CANVAS_W, CANVAS_H,
} from '../config/Constants.js';
import { getZoneConfig, getNextZoneId, ZONE_ORDER } from '../data/zones.js';
import { recomputePlayerDerived } from '../systems/Progression.js';

function defaultPlayer() {
  const p = {
    x: 120,
    y: 300,
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    facingRight: true,

    state: 'idle',

    grounded: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
    wasGrounded: false,
    jumpVarActive: false,

    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDir: 1,
    iframeTimer: 0,
    dodgeBuffer: 0,

    comboIndex: 0,
    attackTimer: 0,
    attackActive: false,
    comboWindow: 0,
    attackInputCooldown: 0,
    hitstopTimer: 0,

    hurtTimer: 0,
    abilityMoveCd: 0,
    abilityMoveTimer: 0,
    abilityDamageCd: 0,
    abilityDamageFxTimer: 0,
    abilityGuardCd: 0,
    abilityGuardTimer: 0,

    xp: 0,
    level: 1,
    stats: { str: 5, vit: 5, agi: 5 },
  };
  recomputePlayerDerived(p);
  p.hp = p.maxHp;
  return p;
}

export function createGameState() {
  const state = {
    tick: 0,
    roundState: 'playing',
    currentZoneId: ZONE_ORDER[0],
    zoneBg:        getZoneConfig(ZONE_ORDER[0]).bg,
    player:        defaultPlayer(),
    enemies:       [],
    hitstop:       0,
    camera:        { x: 0, y: 0 },
    platforms:     [],
    levelW:        CANVAS_W * 2,
    levelH:        CANVAS_H,
    parallaxTuning: null,
    debug:         false,
    _combatEvents: [],
    _audioQueue:   [],
    _hitVfx:       [],
    _shake:        { x: 0, y: 0, power: 0 },
  };
  loadZone(state, ZONE_ORDER[0]);
  return state;
}

/**
 * @param {object} state
 * @param {string} id - zone id (forest | ruins | cave)
 */
export function loadZone(state, id) {
  const z    = getZoneConfig(id);
  const p    = state.player;

  state.currentZoneId = id;
  state.zoneBg         = z.bg;
  state.parallaxTuning = z.parallaxTuning ?? null;
  state.platforms     = z.platforms.map(plat => ({ ...plat }));
  state.levelW        = z.levelW;
  state.levelH        = z.levelH;
  const slimes = z.slimeSpawns.map(([x, y]) => makeSlime(x, y));
  const ranged = (z.rangedSpawns ?? []).map(([x, y]) => makeRanged(x, y));
  const heavy = (z.heavySpawns ?? []).map(([x, y]) => makeHeavy(x, y));
  const nextEnemies = [...slimes, ...ranged, ...heavy];
  // Anti-softlock fallback: ensure each zone has at least one enemy if config is accidentally empty.
  state.enemies       = nextEnemies.length > 0 ? nextEnemies : [makeRanged(z.spawn.x + 220, z.spawn.y)];
  state.roundState    = 'playing';
  state.hitstop       = 0;
  // Transition safety: clear transient combat feedback buffers between zones.
  state._combatEvents = [];
  state._audioQueue   = [];
  state._hitVfx       = [];
  state._shake        = { x: 0, y: 0, power: 0 };
  state._lastBruteTelegraphTick = -999999;

  p.x  = z.spawn.x;
  p.y  = z.spawn.y;
  p.vx = 0;
  p.vy = 0;
  p.state = 'idle';
  p.hurtTimer = 0;
  p.abilityMoveCd = 0;
  p.abilityMoveTimer = 0;
  p.abilityDamageCd = 0;
  p.abilityDamageFxTimer = 0;
  p.abilityGuardCd = 0;
  p.abilityGuardTimer = 0;
  p.grounded  = false;
  p.iframeTimer = 0;
  p.comboIndex = 0;
  p.attackActive = false;
  p.attackTimer  = 0;
  p.dodgeTimer   = 0;
  p.dodgeCooldown = 0;
  p.dodgeBuffer = 0;
  p.attackInputCooldown = 0;
  p.jumpBuffer = 0;
  p.coyoteTimer = 0;
  p.hp = p.maxHp;
  state.camera.x = 0;
  state.camera.y = 0;
}

/**
 * @param {object} state
 * @returns {boolean} true if a next zone was loaded
 */
export function loadNextZoneIfAny(state) {
  const next = getNextZoneId(state.currentZoneId);
  if (!next) return false;
  loadZone(state, next);
  return true;
}

export function resetRun(state) {
  const n = createGameState();
  state.tick = n.tick;
  state.roundState = n.roundState;
  state.currentZoneId = n.currentZoneId;
  state.zoneBg = n.zoneBg;
  state.player = n.player;
  state.enemies = n.enemies;
  state.hitstop = n.hitstop;
  state.camera = n.camera;
  state.platforms = n.platforms;
  state.levelW = n.levelW;
  state.levelH = n.levelH;
  state.parallaxTuning = n.parallaxTuning;
  state.debug = n.debug;
}

function makeSlime(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: SLIME_W,
    h: SLIME_H,
    hp: SLIME_MAX_HP,
    maxHp: SLIME_MAX_HP,
    facingRight: false,
    alive: true,
    type: 'slime',

    state: 'patrol',

    patrolDir: 1,
    patrolTimer: 0,
    chaseTimer: 0,
    telegraphTimer: 0,
    attackTimer: 0,
    hurtTimer: 0,
    hitstopTimer: 0,
    grounded: false,

    /** @type {number | null} set when killed (sim tick) for one-shot death clip */
    deathStartTick: null,

    /** Render-only: offset sim tick for loop anims so spawns are not frame-locked (animClips). */
    _animPhase: (Math.imul(x | 0, 17) ^ (y | 0) * 23) & 0xffff,
  };
}

function makeRanged(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: RANGED_W,
    h: RANGED_H,
    hp: RANGED_MAX_HP,
    maxHp: RANGED_MAX_HP,
    facingRight: false,
    alive: true,
    type: 'ranged',

    state: 'idle',
    patrolDir: 1,
    patrolTimer: 0,
    telegraphTimer: 0,
    attackTimer: 0,
    hurtTimer: 0,
    grounded: false,
    shootCooldown: 0,

    deathStartTick: null,
    _animPhase: (Math.imul(x | 0, 11) ^ (y | 0) * 7) & 0xffff,
  };
}

function makeHeavy(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: HEAVY_W,
    h: HEAVY_H,
    hp: HEAVY_MAX_HP,
    maxHp: HEAVY_MAX_HP,
    facingRight: false,
    alive: true,
    type: 'heavy',

    state: 'idle',
    hurtTimer: 0,
    grounded: false,
    telegraphTimer: 0,
    chargeTimer: 0,
    recoverTimer: 0,
    attackCooldown: 0,
    chargeDir: 1,
    hitThisCharge: false,

    deathStartTick: null,
    _animPhase: (Math.imul(x | 0, 13) ^ (y | 0) * 19) & 0xffff,
  };
}
