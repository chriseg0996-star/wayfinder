// ============================================================
// Low-level blit. Returns true if the image was drawn.
// ============================================================

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {boolean} flipX
 * @returns {boolean}
 */
export function drawImageFrame(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh, flipX) {
  if (!image) {
    return false;
  }
  const srcW = 'naturalWidth' in image && image.naturalWidth
    ? image.naturalWidth
    : (/** @type {{ width: number }} */(image)).width;
  if (!srcW) {
    return false;
  }
  if (typeof Image !== 'undefined' && image instanceof Image && !image.complete) {
    return false;
  }
  if (flipX) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return true;
}
