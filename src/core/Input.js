// ============================================================
// WAYFINDER — Input.js
// Raw key state + snapshot pattern.
// Entities never read Input directly — only the snapshot.
// Phase 2: replace snapshot() with server-received input packet.
// ============================================================

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  e.preventDefault();
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Called once per tick. Returns immutable plain object.
export function snapshot() {
  return {
    left:    !!(keys['ArrowLeft']  || keys['KeyA']),
    right:   !!(keys['ArrowRight'] || keys['KeyD']),
    jump:    !!(keys['Space']      || keys['ArrowUp'] || keys['KeyW']),
    attack:  !!(keys['KeyZ']       || keys['KeyJ']),
    dodge:   !!(keys['KeyX']       || keys['KeyK']),
    debug:   !!(keys['F3']),
  };
}

// Edge detection — call once per tick before snapshot
let _prev = {};
export function snapshotWithEdge() {
  const cur = snapshot();
  const edge = {
    jumpPressed:   cur.jump   && !_prev.jump,
    attackPressed: cur.attack && !_prev.attack,
    dodgePressed:  cur.dodge  && !_prev.dodge,
    debugPressed:  cur.debug  && !_prev.debug,
  };
  _prev = cur;
  return { ...cur, ...edge };
}
