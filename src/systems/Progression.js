// ============================================================
// XP, level, base stats, derived combat/move multipliers.
// ============================================================

import {
  PLAYER_MAX_HP,
  XP_TO_NEXT_BASE,
  XP_TO_NEXT_PER_LEVEL,
  XP_PER_SLIME_KILL,
  STAT_DMG_PER_STR,
  STAT_VIT_MAX_HP,
  STAT_AGI_MOVE,
} from '../config/Constants.js';

export function getXpToNextForLevel(level) {
  return XP_TO_NEXT_BASE + (level - 1) * XP_TO_NEXT_PER_LEVEL;
}

export function recomputePlayerDerived(p) {
  p.maxHp = Math.max(1, Math.floor(PLAYER_MAX_HP * (1 + p.stats.vit * STAT_VIT_MAX_HP)));
  p.hp    = Math.min(p.hp, p.maxHp);
}

export function getPlayerDamageMultiplier(p) {
  return 1 + p.stats.str * STAT_DMG_PER_STR;
}

export function getPlayerMoveSpeedScale(p) {
  return 1 + p.stats.agi * STAT_AGI_MOVE;
}

function applyLevelUp(p) {
  p.level += 1;
  p.stats.str += 1;
  p.stats.vit += 1;
  p.stats.agi += 1;
  recomputePlayerDerived(p);
  p.hp = Math.min(p.maxHp, p.hp + Math.floor(0.25 * p.maxHp));
}

/**
 * @param {object} state
 */
export function awardSlimeKillXp(state) {
  const p   = state.player;
  p.xp     += XP_PER_SLIME_KILL;
  let need  = getXpToNextForLevel(p.level);
  while (p.xp >= need) {
    p.xp -= need;
    applyLevelUp(p);
    need  = getXpToNextForLevel(p.level);
  }
}
