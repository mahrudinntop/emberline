import { World, PHASE } from '../game/src/world.js';
import { makeRandom } from '../game/src/random.js';
import { pilot } from '../game/src/pilot.js';
const world = new World(makeRandom(5));
world.startNight();
let t = 0, guard = 0;
while (world.phase !== PHASE.OVER && guard < 60000) {
  if (world.phase === PHASE.PLAY) {
    const inp = pilot(world);
    if (t > 370) {
      const k = world.keeper;
      const near = world.fires.map((f) => Math.hypot(f.x - k.x, f.z - k.z).toFixed(2)).join(' ');
      console.log(`t=${t.toFixed(0)} k=(${k.x.toFixed(1)},${k.z.toFixed(1)}) tgt=(${inp.tx?.toFixed?.(1) ?? '-'}) mv=(${inp.x.toFixed(2)},${inp.z.toFixed(2)}) pour=${inp.pour} dist=[${near}] phase=${k.ai?.phase} idx=${world.fires.indexOf(k.ai?.fire)}`);
    }
    world.step(1 / 60, inp, true);
    t += 1 / 60;
  } else world.step(1 / 60, { x: 0, z: 0, raise: false, pour: false }, true);
  guard += 1;
  if (t > 380 && t < 381) { console.log('fires', world.fires.map((f) => `(${f.x.toFixed(1)},${f.z.toFixed(1)} fuel=${f.fuel.toFixed(0)})`).join(' ')); }
}
