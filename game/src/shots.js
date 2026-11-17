/* Emberline — the three screenshot scenes behind ?shot=start|play|end, built the way the starter's
   shots.js is built: a fresh world, its real rules played forward by the pilot for a fixed number
   of steps, then one more frame drawn. The same seed always gives the same frame, so a screenshot
   is a promise that the game really looks like this. */

import { World, PHASE } from './world.js';
import { makeRandom } from './random.js';
import { play } from './pilot.js';

export const SHOT_NAMES = ['start', 'play', 'end'];

/**
 * Stage one scene on a world that is already built. `name` is start, play or end; any other value
 * is treated as start. The world is returned with its phase set to what the frame should show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    // A title frame: a few seconds in so the fires burn unevenly and the ash has moved.
    for (let i = 0; i < 180; i += 1) world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
    return { screen: 'title', world };
  }

  if (name === 'play') {
    // Mid-fight, night one. Sixty seconds is deliberately past the first wave: the hero frame has to
    // show the two nouns of the pitch — the darkness, and the keeper standing in it.
    world.startNight();
    play(world, 44);
    return { screen: world.phase === PHASE.OVER ? 'over' : 'play', world };
  }

  // End: the grove is actually lost. A keeper that abandons the ring — stands still while every fire
  // burns down — is a real losing line the player can reproduce, so 'over' is a state the game
  // reached under its own rules, not a painted caption.
  world.startNight();
  let guard = 0;
  while (world.phase !== PHASE.OVER && guard < 240) {
    for (let i = 0; i < 60 * 8; i += 1) {
      world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
      if (world.phase === PHASE.OVER) break;
    }
    guard += 1;
    if (world.phase === PHASE.DAWN) play(world, 44);
  }
  return { screen: world.phase === PHASE.OVER ? 'over' : 'play', world };
}

/** Build a fresh world for a scene. Kept so main.js and any tool share one entry point. */
export function buildWorld(seed) {
  return new World(makeRandom(seed));
}
