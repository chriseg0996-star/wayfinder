// ============================================================
// WAYFINDER — CombatFeedback.js
// Event-driven combat feel layer (hitstop, shake, impact VFX, audio queue).
// Pure state mutation; no gameplay rule changes.
// ============================================================

import {
  FIXED_DT,
  HITSTOP_DURATION,
  SHAKE_DECAY,
  SHAKE_MAX_OFFSET,
  HIT_VFX_LIFE,
  HIT_VFX_MAX,
} from '../config/Constants.js';

/**
 * Push one transient combat event.
 * @param {object} state
 * @param {object} event
 */
export function emitCombatEvent(state, event) {
  if (!state._combatEvents) state._combatEvents = [];
  state._combatEvents.push(event);
}

/**
 * Optional helper for consistent impact payload.
 * @param {object} state
 * @param {number} x
 * @param {number} y
 * @param {number} [shakePower]
 */
export function emitMeleeImpact(state, x, y, shakePower = 1) {
  emitCombatEvent(state, { type: 'melee_impact', x, y, shakePower });
}

/**
 * Attack swing (for light audio cue).
 * @param {object} state
 * @param {'player'|'enemy'} actor
 */
export function emitAttackSwing(state, actor) {
  emitCombatEvent(state, { type: 'attack_swing', actor });
}

/**
 * Enemy hurt event.
 * @param {object} state
 * @param {number} x
 * @param {number} y
 */
export function emitEnemyHurt(state, x, y, amount = 0, crit = false) {
  emitCombatEvent(state, { type: 'enemy_hurt', x, y, amount, crit });
}

/**
 * Advances transient feedback systems once per fixed step.
 * @param {object} state
 * @param {number} [dt]
 */
export function updateCombatFeedback(state, dt = FIXED_DT) {
  if (state.hitstop > 0) {
    state.hitstop = Math.max(0, state.hitstop - dt);
  }
  if (!state._combatEvents) state._combatEvents = [];
  if (!state._hitVfx) state._hitVfx = [];
  if (!state._audioQueue) state._audioQueue = [];
  if (!state._shake) state._shake = { x: 0, y: 0, power: 0 };
  if (!state._damageNumbers) state._damageNumbers = [];

  for (const ev of state._combatEvents) {
    if (!ev || !ev.type) continue;
    if (ev.type === 'melee_impact') {
      state.hitstop = Math.max(state.hitstop, HITSTOP_DURATION);
      const x = ev.x ?? 0;
      const y = ev.y ?? 0;
      const shakePower = Math.max(0.2, ev.shakePower ?? 1);
      state._shake.power = Math.max(state._shake.power, shakePower);
      state._hitVfx.push({
        x,
        y,
        life: HIT_VFX_LIFE,
        maxLife: HIT_VFX_LIFE,
      });
      if (state._hitVfx.length > HIT_VFX_MAX) {
        state._hitVfx.splice(0, state._hitVfx.length - HIT_VFX_MAX);
      }
      state._audioQueue.push({ cue: 'hit', x, y });
      continue;
    }
    if (ev.type === 'attack_swing') {
      state._audioQueue.push({ cue: ev.actor === 'enemy' ? 'enemy_attack' : 'attack' });
      continue;
    }
    if (ev.type === 'enemy_hurt') {
      state._damageNumbers.push({
        x: ev.x ?? 0,
        y: ev.y ?? 0,
        amount: Math.max(0, Math.round(ev.amount ?? 0)),
        crit: Boolean(ev.crit),
        life: 0.6,
        maxLife: 0.6,
      });
      state._audioQueue.push({ cue: 'enemy_hurt', x: ev.x, y: ev.y });
    }
  }
  state._combatEvents.length = 0;

  // Deterministic camera shake (fixed-step noise from tick).
  const s = state._shake;
  if (s.power > 0) {
    const t = state.tick * 0.91;
    const nx = Math.sin(t * 1.7) + Math.cos(t * 2.3);
    const ny = Math.cos(t * 1.3) - Math.sin(t * 2.1);
    const mul = Math.min(SHAKE_MAX_OFFSET, s.power * SHAKE_MAX_OFFSET);
    s.x = Math.round(nx * 0.5 * mul);
    s.y = Math.round(ny * 0.5 * mul);
    s.power = Math.max(0, s.power - SHAKE_DECAY * dt);
  } else {
    s.x = 0;
    s.y = 0;
    s.power = 0;
  }

  // Impact VFX lifetime.
  for (let i = state._hitVfx.length - 1; i >= 0; i--) {
    const v = state._hitVfx[i];
    v.life -= dt;
    if (v.life <= 0) state._hitVfx.splice(i, 1);
  }
  for (let i = state._damageNumbers.length - 1; i >= 0; i--) {
    const d = state._damageNumbers[i];
    d.life -= dt;
    d.y -= 20 * dt;
    if (d.life <= 0) state._damageNumbers.splice(i, 1);
  }
}

