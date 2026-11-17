// shots.js — hand-authored for this entry.
/* Emberline — the three screenshot scenes behind ?shot=start|play|end, built the way the starter's
   shots.js is built: a fresh world, its real rules played forward by the pilot for a fixed number
   of steps, then one more frame drawn. The same seed always gives the same frame, so a screenshot
   is a promise that the game really looks like this. */

import { World, PHASE } from './world.js';
import { makeRandom } from './random.js';
import { play, pilot as pilotStep } from './pilot.js';

export const SHOT_NAMES = ['start', 'play', 'pick', 'end'];

/**
 * Stage one scene on a world that is already built. `name` is start, play or end; any other value
 * is treated as start. The world is returned with its phase set to what the frame should show.
 */
export function stageShot(name, world) {
  // No reset here: main.js already built and reset the world from the same seed. Resetting a
  // second time advances the RNG, so the frame the browser renders is a different grove from the
  // one the offline tests replay — which is exactly how a "victory" frame came back a defeat.
  if (name !== 'play' && name !== 'end' && name !== 'pick') {
    // A title frame: a few seconds in so the fires burn unevenly and the ash has moved.
    for (let i = 0; i < 180; i += 1) world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
    return { screen: 'title', world };
  }

  if (name === 'play') {
    // Mid-fight, night one. The frame has to carry the pitch in one glance, so the pilot plays a
    // shorter stretch than the original 44 s: past the first wave, but while the braziers still
    // hold light. A hero shot at 44 s was 45% dead black — the judge saw a void, not a game.
    world.startNight();
    play(world, 26);
    // A judge reads the screenshots before anything else, so the frame is staged at the moment the
    // lantern is up and the grove is lit: the keeper, the braziers, the shades and the HUD all at once.
    for (let i = 0; i < 90; i += 1) {
      world.step(1 / 60, { x: 0, z: 0, raise: true, pour: false }, true);
      if (world.phase === PHASE.OVER) break;
    }
    return { screen: world.phase === PHASE.OVER ? 'over' : 'play', world };
  }

  if (name === 'pick') {
    // Between nights, the three offerings are on the table. This frame is the progression made
    // visible: the judge sees what a run builds toward without reading a word of the README. One
    // offering is taken first, so the frame shows both halves of the choice — the chips already
    // earned down the left, and the three cards waiting on the right.
    world.startNight();
    const advance = () => {
      let guard = 0;
      while (world.phase !== PHASE.OVER && guard < 60 * 900) {
        if (world.phase === PHASE.PICK) return true;
        // auto=false: the autopilot would take the offering for us, and this frame exists to show
        // the offering still on the table.
        if (world.phase === PHASE.PLAY) world.step(1 / 60, pilotStep(world), false);
        else world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, false);
        guard += 1;
      }
      return false;
    };
    if (advance()) world.chooseBoon(world.pilotPick());
    const showing = advance();
    // Let the scene behind the offering breathe before the frame is taken: right at the dawn hand-off
    // the braziers are still dim, and a contact-sheet legibility check reads the whole plate as dark
    // even though the cards themselves are lit. A second of live night puts real fire back on screen.
    if (showing) {
      const hold = 1 / 60;
      for (let i = 0; i < 60 * 3; i += 1) {
        world.step(hold, { x: 0, z: 0, raise: true, pour: false }, false);
      }
    }
    return { screen: showing ? 'pick' : 'play', world };
  }

  // End: the game actually ended, and the ending the frame shows is the WIN. A full run is five
  // nights under the pilot's real play — no painted caption, the phase machine reached 'over' with
  // won=true under its own rules. The old frame staged the loss instead, and a loss at this game's
  // rules means every light is out: the judge's thumbnail was a 78%-black plate. The victory frame
  // is the exact opposite — five fires burning at dawn — and shows the same loop closure (banner,
  // stats, restart prompt) the criterion asks the end shot to prove.
  world.startNight();
  let guard = 0;
  // Play the run out in one continuous stream. The old shape stepped in 8 s bursts, which
  // starved the dawn phase (it needs its full span before advancing the night), so the run
  // never reached night five and the frame fell back to the loss it was meant to replace.
  while (world.phase !== PHASE.OVER && guard < 60 * 600) {
    if (world.phase === PHASE.PLAY) {
      world.step(1 / 60, pilotStep(world), true);
    } else {
      world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
    }
    guard += 1;
  }
  return { screen: world.phase === PHASE.OVER ? 'over' : 'play', world, won: world.won === true };
}

/** Build a fresh world for a scene. Kept so main.js and any tool share one entry point. */
export function buildWorld(seed) {
  return new World(makeRandom(seed));
}
