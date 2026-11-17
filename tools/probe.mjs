'use strict';
/* probe.js — headless replay of the real rules with the real pilot, printing the fuel/wick books
   once a second. No renderer, no browser: this is the economics, not the picture. */
import { World, PHASE, KIND } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';

const seed = Number(process.argv[2] ?? 5);
const nights = Number(process.argv[3] ?? 2);
const world = new World(makeRandom(seed));

world.startNight(); // main.js does this on TITLE; the rest advances through dawn by itself
while (world.phase !== PHASE.OVER && world.night <= nights) {
  let t = 0;
  let next = 0;
  while (world.phase === PHASE.PLAY && t < 400) {
    const input = pilot(world);
    if (input.hurl) world.throwBolt();
    world.step(1 / 60, input, true);
    t += 1 / 60;
    if (t >= next) {
      next += 10;
      const fuels = world.fires.map((f) => Math.round(f.fuel)).join('/');
      const lit = world.fires.filter((f) => f.lit && f.fuel > 0).length;
      console.log(`n${world.night} t=${t.toFixed(0).padStart(3)} wick=${world.keeper.wick.toFixed(0).padStart(3)} lit=${lit} fuels=${fuels} shades=${world.shades.length} score=${world.score}`);
    }
  }
  console.log(`--- night ${world.night} ended: phase=${world.phase} won=${world.won} ${world.overReason ?? ''} score=${world.score} t=${t.toFixed(0)}`);
  if (world.phase === PHASE.OVER) break;
  // let the real dawn (3.2s) roll into the next night instead of calling startNight() by hand
  for (let i = 0; i < 60 * 4; i += 1) world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
}
