import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';
const seed = Number(process.argv[2] ?? 5);
const world = new World(makeRandom(seed));
world.reset();
world.startNight();
let guard = 0;
while (world.phase !== PHASE.OVER && guard < 36000) {
  world.step(1/60, pilot(world), true);
  guard += 1;
}
console.log(`seed=${seed} won=${world.won} night=${world.night} score=${world.score} lit=${world.fires.filter(f=>f.lit).length} ${world.overReason ?? ''}`);
