// Dev-only: validates that createGameState() is JSON-serializable (no functions, Maps, etc.).
// Runtime state may gain `enemies[]. _hitThisSwing` — that is not in the template.

import { createGameState } from '../state/GameState.js';

export function assertGameStateTemplateSerializable() {
  const s = createGameState();
  const json = JSON.stringify(s);
  if (json === undefined) {
    throw new Error('GameState template stringified to undefined');
  }
  JSON.parse(json);
}
