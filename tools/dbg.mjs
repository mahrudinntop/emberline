import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';
const seed = Number(process.argv[2] ?? 9);
const world = new World(makeRandom(seed));
world.startNight();
let t = 0, next = 0, guard = 0;
while (world.phase !== PHASE.OVER && guard < 60000) {
  if (world.phase === PHASE.PLAY) {
    const inp = pilot(world);
    if (t >= next) {
      next += 6;
      const k = world.keeper;
      const near = world.fires.map((f) => Math.hypot(f.x - k.x, f.z - k.z).toFixed(1)).join(' ');
      console.log(`t=${t.toFixed(0).padStart(3)} wick=${k.wick.toFixed(0).padStart(3)} raised=${k.raised ? 'Y' : 'n'} pour=${inp.pour ? 'Y' : 'n'} mv=${inp.x !== 0 || inp.z !== 0 ? 'Y' : 'n'} shades=${world.shades.length} dist=[${near}] fuels=[${world.fires.map((f) => f.fuel.toFixed(0)).join(' ')}]`);
    }
    world.step(1 / 60, inp, true);
    t += 1 / 60;
  } else world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
  guard += 1;
}
console.log(`END phase=${world.phase} night=${world.night} ${world.overReason ?? ''}`);
