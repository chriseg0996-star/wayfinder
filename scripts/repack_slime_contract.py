"""
Repack raw slime atlas/screenshot into game contract sheet.

Contract target (from project pipeline):
- Output size: 128x144
- Frame size: 32x24
- Rows:
  0 idle(2)
  1 move(4)
  2 telegraph(2)
  3 attack(3)
  4 hurt(2)
  5 death(4)

Usage:
  python scripts/repack_slime_contract.py <input_raw.png> [output.png]

Example:
  python scripts/repack_slime_contract.py slime_raw.png assets/sprites/slime.png
"""

from __future__ import annotations

from collections import deque
from pathlib import Path
import sys

import numpy as np
from PIL import Image


FRAME_W = 32
FRAME_H = 24
ROW_COUNTS = [2, 4, 2, 3, 2, 4]
TOTAL_FRAMES = sum(ROW_COUNTS)

# Detection tuning
GREEN_MIN = 65
PAD = 5
MIN_PIXELS = 20


def green_seed_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3]
    return (a > 10) & (g > GREEN_MIN) & (g > r + 15) & (g > b + 15)


def connected_components(mask: np.ndarray) -> list[list[int]]:
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps: list[list[int]] = []

    for y in range(h):
        xs = np.where(mask[y] & ~seen[y])[0]
        for x0 in xs:
            if seen[y, x0] or not mask[y, x0]:
                continue

            q = deque([(int(x0), int(y))])
            seen[y, x0] = True
            pts: list[tuple[int, int]] = []

            while q:
                x, yy = q.popleft()
                pts.append((x, yy))
                for nx in (x - 1, x, x + 1):
                    for ny in (yy - 1, yy, yy + 1):
                        if nx < 0 or ny < 0 or nx >= w or ny >= h:
                            continue
                        if seen[ny, nx] or not mask[ny, nx]:
                            continue
                        seen[ny, nx] = True
                        q.append((nx, ny))

            if len(pts) > MIN_PIXELS:
                xs2 = [p[0] for p in pts]
                ys2 = [p[1] for p in pts]
                comps.append([min(xs2), min(ys2), max(xs2) + 1, max(ys2) + 1, len(pts)])

    return comps


def merge_nearby(boxes: list[list[int]]) -> list[list[int]]:
    boxes = [b[:] for b in boxes]
    changed = True
    while changed:
        changed = False
        out: list[list[int]] = []
        used = [False] * len(boxes)
        for i, a in enumerate(boxes):
            if used[i]:
                continue
            ax1, ay1, ax2, ay2, aa = a
            used[i] = True
            for j, b in enumerate(boxes):
                if used[j]:
                    continue
                bx1, by1, bx2, by2, ba = b
                v_overlap = min(ay2, by2) - max(ay1, by1)
                same_row = v_overlap > -8 and abs(((ay1 + ay2) // 2) - ((by1 + by2) // 2)) < 40
                h_gap = max(0, max(bx1 - ax2, ax1 - bx2))
                if same_row and h_gap < 28:
                    ax1, ay1 = min(ax1, bx1), min(ay1, by1)
                    ax2, ay2 = max(ax2, bx2), max(ay2, by2)
                    aa += ba
                    used[j] = True
                    changed = True
            out.append([ax1, ay1, ax2, ay2, aa])
        boxes = out
    return boxes


def extract_sprite_alpha(crop: Image.Image) -> Image.Image:
    arr = np.array(crop.convert("RGBA"))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3]

    green = (a > 10) & (g > 65) & (g > r + 15) & (g > b + 15)
    dark_outline = (a > 10) & (r < 75) & (g < 95) & (b < 75)
    bright = (a > 10) & (r > 115) & (g > 130) & (b > 85)
    keep_near = green.copy()

    # Grow seed to preserve local outline/details near body.
    for _ in range(3):
        padded = np.pad(keep_near, 1)
        neigh = np.zeros_like(keep_near)
        for dy in range(3):
            for dx in range(3):
                neigh |= padded[dy : dy + keep_near.shape[0], dx : dx + keep_near.shape[1]]
        keep_near = neigh

    keep = green | ((dark_outline | bright) & keep_near)
    arr[:, :, 3] = np.where(keep, a, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def fit_to_cell(sprite: Image.Image) -> Image.Image:
    arr = np.array(sprite)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 0)
    cell = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    if len(xs) == 0:
        return cell

    x1, x2 = int(xs.min()), int(xs.max() + 1)
    y1, y2 = int(ys.min()), int(ys.max() + 1)
    spr = sprite.crop((x1, y1, x2, y2))

    sw, sh = spr.size
    scale = min(1.0, (FRAME_W - 2) / max(1, sw), (FRAME_H - 1) / max(1, sh))
    if scale < 1.0:
        spr = spr.resize(
            (max(1, int(sw * scale)), max(1, int(sh * scale))),
            Image.Resampling.NEAREST,
        )
        sw, sh = spr.size

    dx = (FRAME_W - sw) // 2
    dy = FRAME_H - sh  # bottom aligned for stable feet
    cell.alpha_composite(spr, (dx, dy))
    return cell


def place_row(sheet: Image.Image, row: int, cells: list[Image.Image]) -> None:
    for col, cell in enumerate(cells):
        sheet.alpha_composite(cell, (col * FRAME_W, row * FRAME_H))


def repack(inp: Path, outp: Path) -> None:
    img = Image.open(inp).convert("RGBA")
    arr = np.array(img)
    seeds = green_seed_mask(arr)
    comps = connected_components(seeds)
    comps = merge_nearby(comps)
    comps = [b for b in comps if (b[2] - b[0]) > 9 and (b[3] - b[1]) > 7]
    comps.sort(key=lambda b: (b[1] // 56, b[0]))

    if len(comps) < TOTAL_FRAMES:
        print(f"WARNING: detected {len(comps)} sprites; expected {TOTAL_FRAMES}.")
    comps = comps[:TOTAL_FRAMES]

    max_cols = max(ROW_COUNTS)  # 4 -> 128 px width
    sheet = Image.new("RGBA", (max_cols * FRAME_W, len(ROW_COUNTS) * FRAME_H), (0, 0, 0, 0))

    # Build linear detected cells first.
    detected_cells: list[Image.Image] = []
    for x1, y1, x2, y2, _ in comps:
        x1 = max(0, x1 - PAD)
        y1 = max(0, y1 - PAD)
        x2 = min(img.width, x2 + PAD)
        y2 = min(img.height, y2 + PAD)
        crop = img.crop((x1, y1, x2, y2))
        spr = extract_sprite_alpha(crop)
        detected_cells.append(fit_to_cell(spr))

    # Fill rows by contract. If missing frames, reuse safest fallback from same row.
    cursor = 0
    fallback = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    for row, count in enumerate(ROW_COUNTS):
        row_cells: list[Image.Image] = []
        for _ in range(count):
            if cursor < len(detected_cells):
                cell = detected_cells[cursor]
                fallback = cell
                row_cells.append(cell)
            else:
                row_cells.append(fallback.copy())
            cursor += 1

        # Guarantee telegraph row has content, prefer idle variants if needed.
        if row == 2 and all(np.array(c)[:, :, 3].max() == 0 for c in row_cells):
            idle_a = sheet.crop((0, 0, FRAME_W, FRAME_H))
            idle_b = sheet.crop((FRAME_W, 0, FRAME_W * 2, FRAME_H))
            row_cells = [idle_a, idle_b]

        place_row(sheet, row, row_cells)

    outp.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(outp)
    print(f"Saved {outp} ({sheet.width}x{sheet.height})")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/repack_slime_contract.py <input_raw.png> [output.png]")
        return 1

    inp = Path(sys.argv[1])
    outp = Path(sys.argv[2]) if len(sys.argv) >= 3 else Path("assets/sprites/slime.png")
    repack(inp, outp)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
