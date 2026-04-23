// ============================================================
// Map gameplay FSM + timers → **animation set keys** (clip rows).
// All timing for one-shots is driven in animClips from Constants
// (attackTimer, dodgeTimer, hurtTimer, deathStartTick, …).
// No state mutation. Single source of truth for render-side labels.
// ============================================================
//
// -- PLAYER: gameplay p.state  →  PlayerAnimKey  (getPlayerAnimKey) ----------
// | p.state  | p.comboIndex     | other              | key       |
// |------------|-----------------|--------------------|-----------|
// | dead, hp≤0| —                | —                  | idle*     |
// | hurt     | —                | hurtTimer          | hurt      |
// | dodge    | —                | dodgeTimer       | dodge       |
// | attack   | 1 / 2 / 3        | attackTimer     | attack_1/2/3|
// | jump     | —                | —                  | jump      |
// | fall     | —                | —                  | fall      |
// | run      | —                | |vx|>LOCO run cut | run         |
// | idle     | —                | (default)          | idle        |
// *Player death uses idle row; art can be “dead = last idle frame” later.
//
// -- SLIME: AI e.state / death  →  SlimeAnimKey  (getSlimeAnimKey) -----------
// | source                         | key       |
// |-------------------------------|------------|
// | e.state=patrol                | idle (loop) |
// | e.state=chase                 | move  (loop) |
// | e.state=telegraph             | telegraph (loop) |
// | e.state=attack                | attack  (one-shot via attackTimer) |
// | e.state=hurt                  | hurt    (one-shot via hurtTimer) |
// | !e.alive, deathStartTick set   | render uses death in animClips, not this fn |
// Death clip timing: animClips, not e.state
//
// ============================================================

import { SLIME_AI_TO_ANIM } from '../config/Constants.js';

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
    if (p.comboIndex === 3) return 'attack_3';
    // Should not occur if startAttack is the only entry; default keeps a stable clip.
    return 'attack_1';
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
  const a = SLIME_AI_TO_ANIM[e.state];
  return a ?? 'idle';
}
