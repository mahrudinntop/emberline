import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';
const seed = Number(process.argv[2] ?? 14);
const world = new World(makeRandom(seed));
world.startNight();
let t = 0, next = 0, guard = 0;
const origBite = [];
while (world.phase !== PHASE.OVER && guard < 60000) {
  if (world.phase === PHASE.PLAY) {
    const inp = pilot(world);
    const before = world.fires.map((f) => f.fuel);
    world.step(1 / 60, inp, true);
    const after = world.fires.map((f) => f.fuel);
    const drop = before.map((b, i) => b - after[i]);
    if (t >= next) {
      next += 4;
      const k = world.keeper;
      console.log(`[${world.phase}] t=${t.toFixed(0).padStart(3)} wick=${k.wick.toFixed(0).padStart(3)} r=${k.raised ? 'Y' : 'n'} p=${inp.pour ? 'Y' : 'n'} mv=${inp.x || inp.z ? 'Y' : 'n'} sh=${world.shades.length} fuels=[${after.map((v) => v.toFixed(0)).join(' ')}] drops=[${drop.map((v) => v.toFixed(2)).join(' ')}]`);
    }
    t += 1 / 60;
  } else world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
  guard += 1;
}
console.log(`END night=${world.night} ${world.overReason ?? ''} score=${world.score}`);
