// ============================================================
// Wire / save snapshot: plain data only, no per-frame transients.
//
// During simulation, entities may hold fields whose names start with
// "_" (e.g. player._gravityScale, enemies[]._hitThisSwing). Those are
// **runtime-only** and are omitted from getSerializableGameState().
// ============================================================

/**
 * Returns a deep plain-data copy of `state` with all `_*` properties
 * removed at every object level. Safe to JSON.stringify for saves / net.
 * Does not mutate the live `state` object.
 * @param {object} state
 * @returns {object}
 */
export function getSerializableGameState(state) {
  return stripUnderscoreKeys(state);
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
 * @param {object} state
 * @returns {string}
 */
export function gameStateToJson(state) {
  return JSON.stringify(getSerializableGameState(state));
}
