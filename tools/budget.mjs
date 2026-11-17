#!/usr/bin/env node
/* Model the wick/fuel budget of a night analytically, no sim, to see whether the difficulty is
   merely hard or actually unwinnable. Numbers come from the game's own config.js, so this
   tracks any tuning instead of lying after a patch. */
import { FIRES, KEEPER, NIGHTS } from '../game/src/config.js';

const fuelToWick = FIRES.relightCost;
const banked = KEEPER.fireGain + KEEPER.passiveGain - KEEPER.idleBurn;
let worst = 0;
for (let i = 0; i < NIGHTS.length; i += 1) {
  const n = NIGHTS[i];
  const mult = 1 + (i + 1) * 0.05;                            // world.js: drain * (1 + night * 0.05)
  const ambientFuel = FIRES.count * FIRES.drain * mult * n.length;
  const ambientWick = ambientFuel * fuelToWick;
  const income = banked * n.length;
  const shades = n.wisp + n.stalker + n.bearer;
  // Budget the bites at one per shade per 3s (not worst case: a shade takes time to walk in).
  const bites = Math.min(shades, 3) * FIRES.hitDrain * (n.length / FIRES.biteEvery) * 0.35;
  const bitesWick = bites * fuelToWick;
  const surplus = income - ambientWick - bitesWick;
  worst = Math.min(worst, surplus);
  console.log(`night ${i + 1}: income=${income.toFixed(0)} wick | ambient=${ambientWick.toFixed(0)}`
    + ` | bites~${bitesWick.toFixed(0)} | surplus=${surplus.toFixed(0)}`);
}
console.log(`\nworst night surplus: ${worst.toFixed(0)} wick ${worst > 0 ? '(winnable)' : '(UNWINNABLE)'}`);
