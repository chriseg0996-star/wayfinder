// ============================================================
// WARDENFALL — Physics.js
// AABB collision. Applies gravity. Resolves platform overlap.
// ============================================================

import { GRAVITY, MAX_FALL_SPEED, FIXED_DT } from '../config/Constants.js';

// Integrate velocity for one entity against platform list
export function integrateEntity(entity, platforms, dt) {
  // Apply gravity
  entity.vy += GRAVITY * dt;
  if (entity.vy > MAX_FALL_SPEED) entity.vy = MAX_FALL_SPEED;

  // Move X
  entity.x += entity.vx * dt;

  // Move Y
  entity.y += entity.vy * dt;

  // Resolve collisions
  entity.grounded = false;
  for (const plat of platforms) {
    if (overlaps(entity, plat)) {
      resolve(entity, plat);
    }
  }
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function resolve(entity, plat) {
  const overlapLeft  = (entity.x + entity.w) - plat.x;
  const overlapRight = (plat.x + plat.w) - entity.x;
  const overlapTop   = (entity.y + entity.h) - plat.y;
  const overlapBot   = (plat.y + plat.h) - entity.y;

  const minX = Math.min(overlapLeft, overlapRight);
  const minY = Math.min(overlapTop, overlapBot);

  if (minY < minX) {
    if (overlapTop < overlapBot) {
      // Landing on top
      entity.y = plat.y - entity.h;
      if (entity.vy > 0) entity.vy = 0;
      entity.grounded = true;
    } else {
      // Hitting ceiling
      entity.y = plat.y + plat.h;
      if (entity.vy < 0) entity.vy = 0;
    }
  } else {
    if (overlapLeft < overlapRight) {
      entity.x = plat.x - entity.w;
      entity.vx = 0;
    } else {
      entity.x = plat.x + plat.w;
      entity.vx = 0;
    }
  }
}

export function clampToLevel(entity, levelW, levelH) {
  if (entity.x < 0) { entity.x = 0; entity.vx = 0; }
  if (entity.x + entity.w > levelW) { entity.x = levelW - entity.w; entity.vx = 0; }
  // Bottom kill plane
  if (entity.y > levelH + 200) {
    entity.y = 0;
    entity.vy = 0;
    entity.hp = Math.max(0, entity.hp - 20);
  }
}
