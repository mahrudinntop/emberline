// input.js — hand-authored for this entry.
/* Emberline — how the player talks to the grove, and how the grove tells the player what happened.
   Keyboard and mouse only, as the rules ask: WASD (or the arrow keys) to move, holding the mouse
   button raises the lantern, a click hurls an ember, Space pours the wick into a guttering fire,
   R restarts, Enter begins, P holds the grove still, 1–3 take an offering, E walks the deep grove
   after the campaign is won, M silences the wind. Every state is mirrored into the page so the
   HUD reads from one place. */

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
let wantOffer = -1;
let wantEndless = false;
let wantMute = false;
let wantPause = false;

/** Choices the loop drains once per frame, so a key is one action and never a held one. */
export function consumeOffer() {
  if (wantOffer < 0) return -1;
  const i = wantOffer;
  wantOffer = -1;
  return i;
}
export function consumeEndless() {
  if (!wantEndless) return false;
  wantEndless = false;
  return true;
}
export function consumeMute() {
  if (!wantMute) return false;
  wantMute = false;
  return true;
}
export function consumePause() {
  if (!wantPause) return false;
  wantPause = false;
  return true;
}

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
    const first = !KEYS.has(e.code);
    KEYS.add(e.code);
    if (e.code === 'KeyR') hooks.onRestart();
    if (e.code === 'Enter' || e.code === 'Space') hooks.onAdvance(e.code);
    // One press, one action: a held key must not fire an offering five times a second.
    if (first) {
      if (e.code === 'KeyP') wantPause = true;
      if (e.code === 'KeyM') wantMute = true;
      if (e.code === 'KeyE') wantEndless = true;
      if (e.code === 'Digit1') wantOffer = 0;
      if (e.code === 'Digit2') wantOffer = 1;
      if (e.code === 'Digit3') wantOffer = 2;
    }
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
  // The offerings are buttons: a click on a card is a choice, and it must not also throw a bolt.
  canvas.addEventListener('pointerdown', (e) => { if (e.button === 0) e.preventDefault(); });
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
