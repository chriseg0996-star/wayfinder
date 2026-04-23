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
    restart:  !!(keys['KeyR']),
    nextZone: !!(keys['KeyN']),
    skill1:   !!(keys['Digit1']),
    skill2:   !!(keys['Digit2']),
    skill3:   !!(keys['Digit3']),
    inventory: !!(keys['KeyI']),
    character: !!(keys['KeyC']),
    map:       !!(keys['KeyM']),
    settings:  !!(keys['Escape']),
    // F3 is OS/browser-dependent; Backquote is a reliable fallback
    debug:   !!(keys['F3']        || keys['Backquote']),
  };
}

// Edge detection — call once per tick before snapshot
let _prev = {};
export function snapshotWithEdge() {
  const cur = snapshot();
  const edge = {
    jumpPressed:     cur.jump     && !_prev.jump,
    attackPressed:   cur.attack   && !_prev.attack,
    dodgePressed:    cur.dodge    && !_prev.dodge,
    restartPressed:  cur.restart  && !_prev.restart,
    nextZonePressed: cur.nextZone && !_prev.nextZone,
    skill1Pressed:   cur.skill1   && !_prev.skill1,
    skill2Pressed:   cur.skill2   && !_prev.skill2,
    skill3Pressed:   cur.skill3   && !_prev.skill3,
    inventoryPressed: cur.inventory && !_prev.inventory,
    characterPressed: cur.character && !_prev.character,
    mapPressed:       cur.map && !_prev.map,
    settingsPressed:  cur.settings && !_prev.settings,
    debugPressed:    cur.debug    && !_prev.debug,
  };
  _prev = cur;
  return { ...cur, ...edge };
}
