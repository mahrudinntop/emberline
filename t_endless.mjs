
import { World, PHASE } from '/home/ubuntu/makefun-multi/emberline/game/src/world.js';
import { makeRandom } from '/home/ubuntu/makefun-multi/emberline/game/src/random.js';
import { pilot } from '/home/ubuntu/makefun-multi/emberline/game/src/pilot.js';

const w = new World(makeRandom(1));
w.startNight();
let g = 0;
while (w.phase !== PHASE.OVER && g < 60000) {
  if (w.phase === PHASE.PLAY) w.step(1/60, pilot(w), true);
  else w.step(1/60, {x:0,z:0,raise:false,pour:false}, true);
  g++;
}
console.log('after campaign: phase=', w.phase, 'won=', w.won, 'night=', w.night, 'score=', w.score);
console.log('taken=', w.taken.join(','));
console.log('mods=', JSON.stringify(w.mods));
const ok = w.startEndless();
console.log('startEndless ->', ok, 'phase=', w.phase, 'endless=', w.endless, 'offers=', (w.offers||[]).map(o=>o.name).join(' | '));
console.log('pilotPick=', w.pilotPick());
w.chooseBoon(w.pilotPick());
console.log('after choose: phase=', w.phase, 'night=', w.night, 'spec=', JSON.stringify(w.nightSpec()), 'taken=', w.taken.length);
let g2=0;
while (w.phase !== PHASE.OVER && w.night < 8 && g2 < 200000) {
  if (w.phase === PHASE.PLAY) w.step(1/60, pilot(w), true);
  else w.step(1/60, {x:0,z:0,raise:false,pour:false}, true);
  g2++;
}
console.log('deep grove: night=', w.night, 'phase=', w.phase, 'score=', w.score, 'endless=', w.endless, 'taken=', w.taken.join(','));
