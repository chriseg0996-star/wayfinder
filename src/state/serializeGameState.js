// ============================================================
// Wire snapshot (JSON / dev export): plain data, no runtime sim noise.
//
// 1) Keys starting with `_` on any object — engine-only
//    (e.g. player._gravityScale, enemies[]._hitThisSwing). Omitted.
//
// 2) WIRE_OMIT_* — per-key lists below. Live `state` in memory still holds
//    full sim; this function returns a **durable slice** for saves / net.
//    See GameState.js header.
// ============================================================

/** @type {Set<string>} */
const WIRE_OMIT_ROOT = new Set(['hitstop', 'debug']);

/** FSM, buffers, timers — not part of a wire checkpoint. */
const WIRE_OMIT_PLAYER = new Set([
  'grounded', 'coyoteTimer', 'jumpBuffer', 'wasGrounded', 'jumpVarActive',
  'dodgeTimer', 'dodgeCooldown', 'dodgeDir', 'iframeTimer', 'dodgeBuffer',
  'comboIndex', 'attackTimer', 'attackActive', 'comboWindow', 'attackInputCooldown',
  'hitstopTimer', 'hurtTimer', 'state',
  'abilityMoveCd', 'abilityMoveTimer', 'abilityDamageCd', 'abilityDamageFxTimer',
  'abilityGuardCd', 'abilityGuardTimer',
]);

/** AI / combat timing / anim bookkeeping — not on wire. */
const WIRE_OMIT_ENEMY = new Set([
  'state', 'patrolDir', 'patrolTimer', 'chaseTimer', 'telegraphTimer', 'attackTimer',
  'hurtTimer', 'hitstopTimer', 'deathStartTick', 'grounded', 'shootCooldown', 'life',
  'chargeTimer', 'recoverTimer', 'attackCooldown', 'chargeDir', 'hitThisCharge',
]);

/**
 * Deep plain-data copy safe for JSON.stringify. Strips `_*` and WIRE_OMIT lists.
 * Does not mutate the live `state` object.
 * @param {object} state
 * @returns {object}
 */
export function getSerializableGameState(state) {
  const copy = stripUnderscoreKeys(state);
  applyWireOmit(copy);
  return copy;
}

function stripUnderscoreKeys(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stripUnderscoreKeys);
  }
  const out = {};
  for (const k of Object.keys(value)) {
    if (k.startsWith('_')) {
      continue;
    }
    out[k] = stripUnderscoreKeys(value[k]);
  }
  return out;
}

/**
 * @param {object} data - already underscore-stripped root state
 */
function applyWireOmit(data) {
  for (const k of WIRE_OMIT_ROOT) {
    if (k in data) delete data[k];
  }
  if (data.player && typeof data.player === 'object') {
    for (const k of WIRE_OMIT_PLAYER) {
      if (k in data.player) delete data.player[k];
    }
  }
  if (Array.isArray(data.enemies)) {
    for (const e of data.enemies) {
      if (e && typeof e === 'object') {
        for (const k of WIRE_OMIT_ENEMY) {
          if (k in e) delete e[k];
        }
      }
    }
  }
}

/**
 * @param {object} state
 * @returns {string}
 */
export function gameStateToJson(state) {
  return JSON.stringify(getSerializableGameState(state));
}
