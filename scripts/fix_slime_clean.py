from collections import deque
from PIL import Image

FRAME_W = 32
FRAME_H = 24

# Orden esperado en el output
ROW_COUNTS = [
    4,  # idle
    5,  # move
    4,  # attack
    3,  # hurt
    4,  # death
]

INPUT_PATH = "slime_raw.png"
OUTPUT_PATH = "slime_fixed.png"

# Filtros para evitar ruido/trozos UI
MIN_AREA = 24
MIN_W = 6
MIN_H = 6


def is_sprite_pixel(px):
    r, g, b, a = px
    if a <= 10:
        return False
    # Slime verde: prioriza verdes para evitar capturar marcos/texto.
    return g > 70 and g > r + 12 and g > b + 12


def detect_boxes(img):
    pixels = img.load()
    w, h = img.size
    visited = [[False] * h for _ in range(w)]
    boxes = []

    for y in range(h):
        for x in range(w):
            if visited[x][y]:
                continue

            visited[x][y] = True
            if not is_sprite_pixel(pixels[x, y]):
                continue

            q = deque([(x, y)])
            minx = maxx = x
            miny = maxy = y
            area = 0

            while q:
                cx, cy = q.popleft()
                area += 1
                minx = min(minx, cx)
                miny = min(miny, cy)
                maxx = max(maxx, cx)
                maxy = max(maxy, cy)

                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if nx < 0 or ny < 0 or nx >= w or ny >= h:
                            continue
                        if visited[nx][ny]:
                            continue
                        visited[nx][ny] = True
                        if is_sprite_pixel(pixels[nx, ny]):
                            q.append((nx, ny))

            bw = maxx - minx + 1
            bh = maxy - miny + 1
            if area >= MIN_AREA and bw >= MIN_W and bh >= MIN_H:
                boxes.append((minx, miny, maxx, maxy, area))

    # Orden lectura: filas arriba->abajo, columnas izquierda->derecha
    boxes.sort(key=lambda b: (b[1] // 40, b[0]))
    return boxes


def pack_sheet(img, boxes):
    cols = max(ROW_COUNTS)  # 5
    rows_count = len(ROW_COUNTS)  # 5
    out = Image.new("RGBA", (cols * FRAME_W, rows_count * FRAME_H), (0, 0, 0, 0))

    i = 0
    total_expected = sum(ROW_COUNTS)
    if len(boxes) < total_expected:
        print(f"WARNING: detectados {len(boxes)} sprites; esperados {total_expected}.")

    for r, count in enumerate(ROW_COUNTS):
        for c in range(count):
            if i >= len(boxes):
                continue

            minx, miny, maxx, maxy, _ = boxes[i]
            sprite = img.crop((minx, miny, maxx + 1, maxy + 1))

            # Si el sprite es más grande que la celda, reducir conservando pixel-art.
            sw, sh = sprite.size
            scale = min(1.0, (FRAME_W - 1) / max(1, sw), (FRAME_H - 1) / max(1, sh))
            if scale < 1.0:
                sprite = sprite.resize(
                    (max(1, int(sw * scale)), max(1, int(sh * scale))),
                    Image.Resampling.NEAREST,
                )
                sw, sh = sprite.size

            dx = c * FRAME_W + (FRAME_W - sw) // 2
            dy = r * FRAME_H + (FRAME_H - sh)  # baseline abajo
            out.alpha_composite(sprite, (dx, dy))
            i += 1

    return out


def main():
    img = Image.open(INPUT_PATH).convert("RGBA")
    boxes = detect_boxes(img)
    out = pack_sheet(img, boxes)
    out.save(OUTPUT_PATH)
    print(f"Saved {OUTPUT_PATH} ({out.width}x{out.height})")


if __name__ == "__main__":
    main()
