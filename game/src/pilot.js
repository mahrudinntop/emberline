'use strict';
/* pilot.js — the autopilot that plays the grove.

   The economy (config.js / world.js):
     lowered in fire light: +6.2 + 1.05 - 0.55 = +6.70 wick/s. The only bank there is.
     raised in fire light:  +6.2*0.45 - 5.15 = about -2.36 wick/s. Fighting costs wick.
     bolt: 15 wick, 1.7 damage, a wisp has 1.0 hp. A bolt cannot kill a wisp. Never hurl.
     raised light: ~3.9 dps at the heart, 9.2 radius, everything inside at once; a raised
       keeper also pulls shades within 11 off their fires and discounts his neighbouring
       fires by 7 in their targeting, so a raised keeper is a lure as well as a weapon.
     fuel: a fire alone loses ~0.65/s; each chewer takes 4.5 per 1.15s = 3.9/s; pouring
       relights a dark fire the moment its fuel goes above zero.

   Instrumenting losses showed the two things that actually kill this grove:
     1. Fuel-blind triage. A fire at 60 with three chewers dies in 15s; a fire at 20 with
        none lasts 30s. Urgency is chewers first, fuel second — never fuel alone.
     2. One killbox per fire. Fires sit ~16 apart, so a keeper standing at one fire is
        14+ units from the chewers of its neighbours: outside the 9.2 burn and outside the
        11 lure. But the midpoint between two chewed fires is ~8 from both — inside both.
        So: killbox at the midpoint of the two most-chewed fires when they are close enough
        to bridge, otherwise on the worst fire itself. */
import { KIND } from './world.js';

const POUR_REACH = 2.8;
const RAISE_AT = 48;
const LOWER_AT = 18;
const FEED_TOPUP = 92;
const FEED_FLOOR = 12;
const THREAT_IN = 14;
const AMBIENT = 0.65;      // config drain 0.62 x night multiplier ~ 0.65
const CHEW_RATE = 3.9;     // 4.5 fuel per 1.15s per chewer
const BRIDGE = 19;         // max fire gap the killbox midpoint can still cover
const OFF = 6.5;           // killbox offset from a fire toward its chewers

/** Chewers per fire, from the shades' own targets. */
function chewersByFire(world) {
  const n = new Array(world.fires.length).fill(0);
  for (let i = 0; i < world.shades.length; i += 1) {
    const t = world.shades[i].target;
    if (t && t.fire) n[world.fires.indexOf(t.fire)] += 1;
  }
  return n;
}

/** Seconds until each fire dies at its current chew rate. Dark = pour me. */
function fireUrgency(world, chewers) {
  const k = world.keeper;
  return world.fires.map((f, i) => {
    const rate = AMBIENT + chewers[i] * CHEW_RATE + 0.001;
    const walk = Math.hypot(f.x - k.x, f.z - k.z) * 0.35;   // seconds of travel, discounted
    return (f.fuel + walk * rate) / rate;
  });
}

function dir(dx, dz, eps) {
  const len = Math.hypot(dx, dz) || 1;
  return len > eps ? { x: dx / len, z: dz / len } : { x: 0, z: 0 };
}

export function pilot(world) {
  const k = world.keeper;
  const S = (k.ai ??= { phase: 'feed', fire: null, rimClock: 0 });

  let shades = 0;
  let closest = Infinity;
  for (let i = 0; i < world.shades.length; i += 1) {
    const s = world.shades[i];
    const d = Math.hypot(s.x - k.x, s.z - k.z);
    if (d < closest) closest = d;
    shades += 1;
  }
  const chewers = chewersByFire(world);
  const totalChewers = chewers.reduce((a, b) => a + b, 0);
  const urgency = fireUrgency(world, chewers);
  const worst = urgency.indexOf(Math.min(...urgency));
  const order = urgency.map((u, i) => [u, i]).sort((a, b) => a[0] - b[0]);
  const secondWorst = order[1] ? order[1][1] : worst;

  // ---------- transitions ----------
  if (S.phase === 'feed') {
    const wave = (shades >= 6 && k.wick >= 20) || totalChewers >= 2;
    const close = shades > 0 && closest < THREAT_IN && k.wick >= RAISE_AT;
    if (wave || close) {
      S.phase = 'kill';
      S.rimClock = 0;
    }
  } else {
    let worstFuel = Infinity;
    for (let i = 0; i < world.fires.length; i += 1) if (world.fires[i].fuel < worstFuel) worstFuel = world.fires[i].fuel;
    const fieldClear = shades === 0;
    const rimQuiet = closest > 12;
    S.rimClock = rimQuiet ? S.rimClock + 1 : 0;
    // Out of the raise when: the wick is thin; OR the field is clear (raise earns nothing
    // with nothing to burn and costs -2.4/s); OR the rim has been quiet for two beats and a
    // fire is starving (the killbox defends one fire, the ring has five).
    const starving = worstFuel < 45;
    if (k.wick < LOWER_AT || fieldClear || (rimQuiet && S.rimClock > 120 && starving)) {
      S.phase = 'feed';
      S.rimClock = 0;
    }
  }


  // ---------- actions ----------
  if (S.phase === 'kill') {
    let tx;
    let tz;
    const f = world.fires[worst];
    const g = world.fires[secondWorst];
    if (totalChewers >= 2 && g !== f && chewers[secondWorst] > 0) {
      const df = Math.hypot(f.x - g.x, f.z - g.z);
      if (df <= BRIDGE) {
        // bridge both chewed fires: the midpoint is inside the burn and the lure for both
        tx = (f.x + g.x) / 2;
        tz = (f.z + g.z) / 2;
      } else {
        // meet the wave on the near side of the worst fire
        let cx = 0;
        let cz = 0;
        let cn = 0;
        for (let i = 0; i < world.shades.length; i += 1) { cx += world.shades[i].x; cz += world.shades[i].z; cn += 1; }
        const dxw = cn ? cx / cn - f.x : 0;
        const dzw = cn ? cz / cn - f.z : 0;
        const wl = Math.hypot(dxw, dzw) || 1;
        tx = f.x + (dxw / wl) * OFF;
        tz = f.z + (dzw / wl) * OFF;
      }
    } else {
      tx = f.x;
      tz = f.z;
    }
    if (k.wick < 34) {
      const fat = world.fires.reduce((a, b) => (b.lit && b.fuel > (a?.fuel ?? -1) ? b : a), null);
      if (fat) { tx = fat.x; tz = fat.z; }
    }
    const mv = dir(tx - k.x, tz - k.z, 0.25);
    return { x: mv.x, z: mv.z, raise: true, pour: false, hurl: false };
  }

  // ---------- FEED: pour the neediest fire, stand in its light ----------
  // Re-commit when the committed fire is fed (>= TOPUP, the same bar pour stops at — using a
  // higher bar here deadlocks: fed to 92, pour wants < 92, recommit wants >= 96, forever),
  // when it has chewers on it (feeding a fire being eaten is throwing wick away), or when
  // there is no commitment yet.
  if (!S.fire || S.fire.fuel >= FEED_TOPUP || chewers[world.fires.indexOf(S.fire)] > 0) {
    S.fire = world.fires[worst];
  }
  const f = S.fire;
  const d = Math.hypot(f.x - k.x, f.z - k.z);
  const pour = d <= POUR_REACH && f.fuel < FEED_TOPUP && k.wick > FEED_FLOOR;
  const mv = dir(f.x - k.x, f.z - k.z, 0.25);
  return { x: mv.x, z: mv.z, raise: false, pour, hurl: false };
}

export { KIND };
export const play = pilot; // the shot driver and old callers import the pilot as `play`
