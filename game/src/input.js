// input.js — hand-authored for this entry.
/* Emberline — how the player talks to the grove, and how the grove tells the player what happened.
   Keyboard and mouse only, as the rules ask: WASD (or the arrow keys) to move, holding the mouse
   button raises the lantern, a click hurls an ember, Space pours the wick into a guttering fire,
   R restarts, Enter begins. Every state is mirrored into the page so the HUD reads from one place. */

export const input = {
  x: 0,
  z: 0,
  raise: false,
  pour: false,
  hurl: false,
};

const KEYS = new Set();
let pointerDown = false;
let wantHurl = false;

function axis() {
  let x = 0;
  let z = 0;
  if (KEYS.has('KeyA') || KEYS.has('ArrowLeft')) x -= 1;
  if (KEYS.has('KeyD') || KEYS.has('ArrowRight')) x += 1;
  if (KEYS.has('KeyW') || KEYS.has('ArrowUp')) z -= 1;
  if (KEYS.has('KeyS') || KEYS.has('ArrowDown')) z += 1;
  return { x, z };
}

function refresh() {
  const a = axis();
  input.x = a.x;
  input.z = a.z;
  input.raise = pointerDown || KEYS.has('ShiftLeft') || KEYS.has('ShiftRight');
  input.pour = KEYS.has('Space');
}

export function attachInput(canvas, hooks) {
  const onKeyDown = (e) => {
    if (e.code === 'Tab' || e.code === 'F5') return;
    KEYS.add(e.code);
    if (e.code === 'KeyR') hooks.onRestart();
    if (e.code === 'Enter' || e.code === 'Space') hooks.onAdvance(e.code);
    if (e.code === 'Space') e.preventDefault();
    refresh();
  };
  const onKeyUp = (e) => {
    KEYS.delete(e.code);
    refresh();
  };
  const onPointerDown = (e) => {
    if (e.button === 0) { pointerDown = true; wantHurl = true; }
    refresh();
  };
  const onPointerUp = () => { pointerDown = false; refresh(); };
  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    hooks.onAim(nx, ny);
  };
  const onBlur = () => { KEYS.clear(); pointerDown = false; refresh(); };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointermove', onPointerMove);
  };
}

/** A click is one throw, not a held one: it fires once and clears. */
export function consumeHurl() {
  if (!wantHurl) return false;
  wantHurl = false;
  return true;
}
