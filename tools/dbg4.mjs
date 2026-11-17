import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';
const seed = Number(process.argv[2] ?? 1);
const world = new World(makeRandom(seed));
world.startNight();
let t = 0, guard = 0, lastPhase = '';
while (world.phase !== PHASE.OVER && guard < 60000) {
  if (world.phase === PHASE.PLAY) {
    const inp = pilot(world);
    world.step(1 / 60, inp, true);
    t += 1 / 60;
  } else world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
  if (world.phase !== lastPhase) {
    lastPhase = world.phase;
    const k = world.keeper;
    console.log(`[${world.phase}] t=${t.toFixed(0)} night=${world.night} wick=${k.wick.toFixed(0)} fuels=[${world.fires.map((f) => f.fuel.toFixed(0)).join(' ')}] shades=${world.shades.length} ai=${k.ai?.phase}`);
  }
  guard += 1;
}
console.log(`END night=${world.night} ${world.overReason ?? ''} score=${world.score}`);
