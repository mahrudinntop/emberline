#!/usr/bin/env node
/* sweep.mjs — tune the pilot against the real rules, not against a feeling.
   Runs N seeds through the headless world and prints win rate + mean night reached. */
import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';

const N = Number(process.argv[2] ?? 24);
let wins = 0;
let totalNight = 0;
const log = [];
for (let seed = 1; seed <= N; seed += 1) {
  const world = new World(makeRandom(seed));
  world.startNight();
  let guard = 0;
  while (world.phase !== PHASE.OVER && guard < 60000) {
    if (world.phase === PHASE.PLAY) {
      const input = pilot(world);
      world.step(1 / 60, input, true);
    } else {
      world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
    }
    guard += 1;
  }
  const won = world.won === true;
  if (won) wins += 1;
  totalNight += won ? 5 : world.night;
  log.push(`${won ? 'WIN ' : 'loss'} seed=${seed} night=${world.night} score=${world.score}`);
}
console.log(log.join('\n'));
console.log(`\n== ${wins}/${N} wins, mean night ${(totalNight / N).toFixed(2)} ==`);
