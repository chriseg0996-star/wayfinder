// Dev-only: JSON round-trip for getSerializableGameState (underscore + wire-omit).

import { createGameState } from '../state/GameState.js';
import { getSerializableGameState } from '../state/serializeGameState.js';

/**
 * Validates that a fresh `createGameState()` round-trips after transient stripping.
 * (Template has no _* fields, so this matches full-state serializability.)
 */
export function assertGameStateTemplateSerializable() {
  const s = getSerializableGameState(createGameState());
  const json = JSON.stringify(s);
  if (json === undefined) {
    throw new Error('Serializable game state stringified to undefined');
  }
  JSON.parse(json);
}

/**
 * After gameplay has run, transients may exist; stripped snapshot must still round-trip.
 * @param {object} state - live game state
 */
export function assertLiveStateSerializableWhenStripped(state) {
  const s = getSerializableGameState(state);
  const json = JSON.stringify(s);
  if (json === undefined) {
    throw new Error('Stripped live state stringified to undefined');
  }
  JSON.parse(json);
}
