
import { World, PHASE } from '/home/ubuntu/makefun-multi/emberline/game/src/world.js';
import { makeRandom } from '/home/ubuntu/makefun-multi/emberline/game/src/random.js';
import { pilot } from '/home/ubuntu/makefun-multi/emberline/game/src/pilot.js';
const w = new World(makeRandom(1));
w.startNight();
let g=0, picks=0, log=[];
while (w.phase !== PHASE.OVER && g < 400000) {
  if (w.phase === PHASE.PICK) { picks++; log.push(`pick@night${w.night} offers=${w.offers.map(o=>o.name).join(',')} taken=${w.taken.length}`); w.chooseBoon(w.pilotPick()); g++; continue; }
  if (w.phase === PHASE.PLAY) w.step(1/60, pilot(w), true);
  else w.step(1/60, {x:0,z:0,raise:false,pour:false}, true);
  g++;
}
console.log(log.join('\n'));
console.log('end: phase', w.phase, 'night', w.night, 'won', w.won, 'taken', w.taken.length);
