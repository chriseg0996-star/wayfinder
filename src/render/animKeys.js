// ============================================================
// Map gameplay FSM → **animation set keys** (render / clips only).
// No gameplay side effects. Keep in sync with Player + slime AI.
// ============================================================

/**
 * @typedef {'idle' | 'run' | 'jump' | 'fall' | 'attack_1' | 'attack_2' | 'attack_3' | 'dodge' | 'hurt'} PlayerAnimKey
 */

/**
 * @param {object} p
 * @returns {PlayerAnimKey}
 */
export function getPlayerAnimKey(p) {
  if (p.state === 'dead' || p.hp <= 0) {
    return 'idle';
  }
  if (p.state === 'hurt') {
    return 'hurt';
  }
  if (p.state === 'dodge') {
    return 'dodge';
  }
  if (p.state === 'attack') {
    if (p.comboIndex === 1) return 'attack_1';
    if (p.comboIndex === 2) return 'attack_2';
    return 'attack_3';
  }
  if (p.state === 'jump') {
    return 'jump';
  }
  if (p.state === 'fall') {
    return 'fall';
  }
  if (p.state === 'run') {
    return 'run';
  }
  return 'idle';
}

/**
 * @typedef {'idle' | 'move' | 'telegraph' | 'attack' | 'hurt' | 'death'} SlimeAnimKey
 */

/**
 * @param {object} e - slime
 * @returns {SlimeAnimKey}
 */
export function getSlimeAnimKey(e) {
  if (!e.alive && e.deathStartTick != null) {
    return 'death';
  }
  if (e.state === 'hurt') {
    return 'hurt';
  }
  if (e.state === 'telegraph') {
    return 'telegraph';
  }
  if (e.state === 'attack') {
    return 'attack';
  }
  if (e.state === 'chase') {
    return 'move';
  }
  if (e.state === 'patrol') {
    return 'idle';
  }
  return 'idle';
}
