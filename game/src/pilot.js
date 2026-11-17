// pilot.js — hand-authored for this entry.
/* Emberline — a small deterministic pilot that plays the real rules forward, used only to stage the
   three screenshots. It reads the same world the player does and presses the same keys: walk to the
   fire that will gutter first, pour the wick while close, raise the lantern when a shade comes in,
   hurl an ember at anything that is not yet in the light. Nothing here is a second set of rules. */

import { FIRES } from './config.js';
import { KIND, PHASE } from './world.js';

const SAMPLE = 1 / 60;

function weakestFire(world) {
  let best = null;
  let bestFuel = Infinity;
  for (let i = 0; i < world.fires.length; i += 1) {
    const f = world.fires[i];
    const fuel = f.lit ? f.fuel : -1;
    if (fuel < bestFuel) { bestFuel = fuel; best = f; }
  }
  return best;
}

function nearestShade(world) {
  const k = world.keeper;
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < world.shades.length; i += 1) {
    const s = world.shades[i];
    const d = Math.hypot(s.x - k.x, s.z - k.z);
    if (d < bestD) { bestD = d; best = s; }
  }
  return { shade: best, distance: bestD };
}

/**
 * One frame of the pilot, returned in the same shape the keyboard produces, plus the intent flags
 * the game loop reads (raise, pour, hurl).
 */
export function pilot(world) {
  const k = world.keeper;
  const target = weakestFire(world);
  const { shade, distance } = nearestShade(world);

  const input = { x: 0, z: 0, raise: false, pour: false, hurl: false };
  if (target === null) return input;

  // Danger reads first: a shade inside the light means raise, a shade at arm's length means throw.
  const shadeOnFire = (() => {
    let worst = null;
    for (let i = 0; i < world.fires.length; i += 1) {
      const f = world.fires[i];
      for (let j = 0; j < world.shades.length; j += 1) {
        const s = world.shades[j];
        if (Math.hypot(s.x - f.x, s.z - f.z) < 2.6 && (worst === null || f.fuel < worst.fuel)) worst = f;
      }
    }
    return worst;
  })();

  const goal = shadeOnFire ?? target;
  const dx = goal.x - k.x;
  const dz = goal.z - k.z;
  const d = Math.hypot(dx, dz);

  if (d > (goal === target ? 2.1 : 4.4)) {
    input.x = dx / d;
    input.z = dz / d;
  }

  // In light range of a shade: raise the lantern to burn it down.
  if (shade !== null && distance < 7.6 && k.wick > 30) input.raise = true;
  // Pour when standing at a guttering fire with a healthy wick.
  if (goal === target && d < 2.6 && k.wick > 26 && target.fuel < 78) input.pour = true;
  // Elsewhere, keep the wick recovering.
  if (k.wick < 22) { input.raise = false; input.pour = false; }
  // A shade within reach and not yet burning: hurl one.
  if (shade !== null && distance < 7.0 && k.wick > 44 && !input.raise) input.hurl = true;

  return input;
}

/** Play `seconds` of the real game forward and return the world. */
export function play(world, seconds) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.phase === PHASE.OVER) break;
    const input = pilot(world);
    if (input.hurl) world.throwBolt();
    world.step(SAMPLE, input, true);
  }
  return world;
}
