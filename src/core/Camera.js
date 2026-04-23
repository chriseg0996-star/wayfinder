// ============================================================
// WARDENFALL — Camera.js
// Smooth follow with lead + vertical deadzone.
// ============================================================

import {
  CANVAS_W, CANVAS_H,
  CAM_LEAD_X, CAM_LERP, CAM_DEADZONE_Y,
  FIXED_DT,
} from '../config/Constants.js';

export function updateCamera(state) {
  const p   = state.player;
  const cam = state.camera;
  const dt  = FIXED_DT;

  if (state.hitstop > 0) return;

  // Target X: center player + lead ahead
  const lead   = p.facingRight ? CAM_LEAD_X : -CAM_LEAD_X;
  const targetX = (p.x + p.w / 2) - CANVAS_W / 2 + lead;

  // Target Y: deadzone
  const playerCenterY = p.y + p.h / 2;
  const camCenterY    = cam.y + CANVAS_H / 2;
  let targetY = cam.y;
  if (playerCenterY < camCenterY - CAM_DEADZONE_Y) {
    targetY = playerCenterY - CANVAS_H / 2 + CAM_DEADZONE_Y;
  } else if (playerCenterY > camCenterY + CAM_DEADZONE_Y) {
    targetY = playerCenterY - CANVAS_H / 2 - CAM_DEADZONE_Y;
  }

  // Lerp
  cam.x += (targetX - cam.x) * CAM_LERP * dt;
  cam.y += (targetY - cam.y) * CAM_LERP * dt;

  // Clamp to level
  cam.x = Math.max(0, Math.min(cam.x, state.levelW - CANVAS_W));
  cam.y = Math.max(0, Math.min(cam.y, state.levelH - CANVAS_H));
}
