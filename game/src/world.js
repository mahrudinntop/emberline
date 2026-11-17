// world.js — the rules: pure simulation state and per-step logic, with nothing about how any of it is drawn.
// world.js — hand-authored for this entry.
/* Emberline — the rules, and nothing about how they are drawn.
   The grove is a disc of dark. Five fires stand on a ring; each holds back the dark within its own
   radius while it has fuel, and each loses fuel every second it burns. The keeper carries one wick:
   raising the lantern reaches further and burns the shades, but drains the wick fast; lowering it
   lets the wick recover, quicker still while standing in a fire's light. A shade that reaches a
   fire bites fuel off it. Fuel spent is not lost: the keeper pours their own wick into a guttering
   fire to bring it back. Winds rise each night. When the last fire goes out, the grove goes dark. */

// --- imports ---
import { FIRES, KEEPER, SCORE, SHADES, STEP, NIGHTS } from './config.js';

// --- shared enums: game phases and shade kinds ---
export const PHASE = { TITLE: 'title', BRIEF: 'brief', PLAY: 'play', DAWN: 'dawn', OVER: 'over' };
export const KIND = { WISP: 'wisp', STALKER: 'stalker', BEARER: 'bearer' };

// --- small helpers ---
const TAU = Math.PI * 2;
const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

// --- the World class: the whole simulation ---
export class World {
  constructor(random) {
    this.random = random;
    this.reset();
  }

  // --- reset: a fresh grove, ring of fires, keeper, and scattered props.
  reset() {
    const r = this.random;
    this.phase = PHASE.TITLE;
    this.night = 0;
    this.score = 0;
    this.best = this.best ?? 0;
    this.clock = 0;
    this.nightClock = 0;
    this.combo = 0;
    this.comboClock = 0;
    this.flash = 0;
    this.shake = 0;
    this.banner = null;
    this.overReason = '';

    this.fires = [];
    const start = r.angle();
    for (let i = 0; i < FIRES.count; i += 1) {
      // An organic ring: the pentagon stays readable as 'five fires around a grove', but each angle
      // and radius is jittered so no two spans match and the ring does not read as stamped.
      const a = start + (i / FIRES.count) * TAU + r.range(-0.17, 0.17);
      const rad = FIRES.ring + r.range(-2.0, 2.4);
      this.fires.push({
        x: Math.cos(a) * rad,
        z: Math.sin(a) * rad,
        fuel: 100,
        lit: true,
        sway: r.angle(),
        seed: r.int(1, 9999),
        bite: 0,
      });
    }

    this.keeper = {
      x: 0, z: 0,
      vx: 0, vz: 0,
      facing: start,
      wick: KEEPER.wick,
      raised: false,
      hurt: 0,
      hurtClock: 0,
      hurlClock: 0,
    };

    this.shades = [];
    this.bolts = [];
    this.motes = [];
    this.sparks = [];
    this.spawnQueue = [];
    this.spawnClock = 0;
    this.wave = null;

    // The grove's furniture is scattered anywhere the fires and the middle are not.
    this.props = [];
    for (let i = 0; i < 74; i += 1) {
      const p = r.inDisc(28.5, 3.2);
      if (this.nearestFire(p.x, p.z) < 4.6) continue;
      this.props.push({ kind: 'tree', x: p.x, z: p.z, h: r.range(3.4, 7.2), w: r.range(0.5, 0.95), t: r.angle() });
    }
    for (let i = 0; i < 16; i += 1) {
      const p = r.inDisc(27.5, 4);
      // Nothing is scattered on top of a brazier: a rock inside a fire reads as a bug, not as nature.
      if (this.nearestFire(p.x, p.z) < 3.4) continue;
      this.props.push({ kind: 'rock', x: p.x, z: p.z, h: r.range(0.5, 1.4), w: r.range(0.8, 1.7), t: r.angle() });
    }
    // Low embers along the ground: the only thing that carries colour into the outer dark.
    this.reeds = [];
    for (let i = 0; i < 140; i += 1) {
      const p = r.inDisc(29, 2.5);
      this.reeds.push({ x: p.x, z: p.z, h: r.range(0.25, 0.7), t: r.angle() });
    }
    // The fires' own floor stain: a dark ring the player reads as "this is a fire's ground".
    return this;
  }

  // --- nearestFire: distance from a point to the closest fire.
  nearestFire(x, z) {
    let best = Infinity;
    for (let i = 0; i < this.fires.length; i += 1) {
      const d = Math.hypot(x - this.fires[i].x, z - this.fires[i].z);
      if (d < best) best = d;
    }
    return best;
  }

  // --- fireRadius: how far a fire's light actually reaches.
  /** Light radius a fire actually casts: grows as it burns well, shrinks as it gutters, and a
      freshly lit fire blooms past its steady size for a moment. */
  fireRadius(fire) {
    if (!fire.lit || fire.fuel <= 0) return 0;
    const health = Math.max(0, Math.min(1, fire.fuel / 100));
    const base = FIRES.lightMin + (FIRES.lightMax - FIRES.lightMin) * (0.35 + 0.65 * health);
    const bloom = fire.bite > 0 ? fire.bite * 0.8 : 0;
    const rise = Math.min(1, fire.fuel / 18) ** 0.6;
    return (base + bloom) * rise;
  }

  // --- keeperRadius: the lantern's own reach.
  /** The keeper's own light: the lantern reaches much further while it is raised. */
  keeperRadius() {
    const k = this.keeper;
    const base = 3.4 + 3.9 * Math.max(0, Math.min(1, k.wick / KEEPER.wickMax));
    return k.raised ? KEEPER.raiseRadius + base * 0.35 : base;
  }

  // --- litAt: is a point inside any light?
  /** Whether a point is inside any light: a fire's or the raised lantern's. */
  litAt(x, z) {
    for (let i = 0; i < this.fires.length; i += 1) {
      const f = this.fires[i];
      const r = this.fireRadius(f);
      if (r > 0 && dist2(x, z, f.x, f.z) < r * r) return true;
    }
    const k = this.keeper;
    if (k.raised) {
      const r = this.keeperRadius();
      if (dist2(x, z, k.x, k.z) < r * r) return true;
    }
    return false;
  }

  // --- burnAt: the damage the raised lantern deals at a point.
  /** The light that does the burning: only the raised lantern. Fires hold shades off, they do not
      kill them, which is what makes carrying the ember a decision rather than a chore. */
  burnAt(x, z) {
    const k = this.keeper;
    if (!k.raised) return 0;
    const r = this.keeperRadius();
    const d = Math.hypot(x - k.x, z - k.z);
    if (d > r) return 0;
    const t = 1 - d / r;
    return KEEPER.burnPerSecond * (0.35 + t * t * 1.35) * 2.2;
  }

  // --- startNight: build this night's spawn queue from the NIGHTS spec.
  startNight() {
    const spec = NIGHTS[Math.min(this.night, NIGHTS.length - 1)];
    this.night += 1;
    this.phase = PHASE.PLAY;
    this.nightClock = 0;
    this.nightLength = spec.length;
    this.spawnQueue = [];
    const r = this.random;
    const kinds = [];
    for (let i = 0; i < spec.wisp; i += 1) kinds.push(KIND.WISP);
    for (let i = 0; i < spec.stalker; i += 1) kinds.push(KIND.STALKER);
    for (let i = 0; i < spec.bearer; i += 1) kinds.push(KIND.BEARER);
    r.shuffle(kinds);
    let t = 1.2;
    for (let i = 0; i < kinds.length; i += 1) {
      this.spawnQueue.push({ t, kind: kinds[i] });
      t += spec.gap * r.range(0.65, 1.45);
    }
    this.banner = { text: `Night ${this.night}`, life: 2.6, sub: spec.bearer > 0 ? 'A bearer walks abroad tonight.' : '' };
    // A night begins with the ring freshly fed and the grove empty: a fire carried over at 4%
    // fuel was never a rule anyone could play against, it was a bug pretending to be a rule.
    for (let i = 0; i < this.fires.length; i += 1) {
      const f = this.fires[i];
      f.lit = true;
      f.fuel = 100;
      f.ember = 1;
      f.bite = 0;
    }
    this.shades.length = 0;
    // The spawn clock is a per-night clock: without this reset every night after the first
    // dumps its entire queue in one frame, and the wave pacing in NIGHTS is dead on arrival.
    this.spawnClock = 0;
    return this;
  }

  // --- spawnShade: place a new shade at the grove's rim.
  spawnShade(kind) {
    const r = this.random;
    const spec = SHADES[kind];
    const a = r.angle();
    const radius = 27 + r.range(0, 3);
    const spin = r.sign();
    this.shades.push({
      kind, ...spec,
      x: Math.cos(a) * radius,
      z: Math.sin(a) * radius,
      vx: 0, vz: 0,
      hp: spec.hp,
      target: null,
      biteClock: 0,
      lungeClock: 0,
      spin,
      hurt: 0,
      bob: r.angle(),
    });
  }

  // --- chooseTarget: decide what a shade walks toward.
  /** Draw a shade to the closest fire that still has fuel, with the keeper's raised lantern a
      stronger lure: the player can pull a wave off a guttering fire by standing in the open. */
  chooseTarget(shade) {
    const k = this.keeper;
    let best = null;
    let bestCost = Infinity;
    for (let i = 0; i < this.fires.length; i += 1) {
      const f = this.fires[i];
      if (!f.lit || f.fuel <= 0) continue;
      let cost = Math.hypot(shade.x - f.x, shade.z - f.z) - f.fuel * 0.035;
      if (k.raised && dist2(k.x, k.z, f.x, f.z) < 100) cost -= 7;
      if (cost < bestCost) { bestCost = cost; best = f; }
    }
    if (k.raised && best !== null) {
      const dk = Math.hypot(shade.x - k.x, shade.z - k.z);
      if (dk < 11) return { keeper: true };
    }
    return best === null ? { keeper: true } : { fire: best };
  }

  // --- throwBolt: spend wick to hurl an ember.
  throwBolt() {
    const k = this.keeper;
    if (k.hurlClock > 0 || k.wick < KEEPER.hurlCost) return false;
    k.wick -= KEEPER.hurlCost;
    k.hurlClock = KEEPER.hurlCooldown;
    this.bolts.push({
      x: k.x, z: k.z,
      vx: Math.cos(k.facing) * KEEPER.hurlSpeed,
      vz: Math.sin(k.facing) * KEEPER.hurlSpeed,
      life: 1.1,
    });
    return true;
  }

  // --- addSpark: spawn a burst of visual sparks.
  addSpark(x, z, count, warmth) {
    const r = this.random;
    for (let i = 0; i < count; i += 1) {
      const a = r.angle();
      const s = r.range(1.4, 5.2);
      this.sparks.push({
        x, z, y: r.range(0.2, 1.1),
        vx: Math.cos(a) * s, vz: Math.sin(a) * s,
        vy: r.range(1.2, 3.4),
        life: r.range(0.3, 0.85), max: 0.85, warmth,
      });
    }
    if (this.sparks.length > 260) this.sparks.splice(0, this.sparks.length - 260);
  }

  // --- step: one fixed-step tick of the whole simulation.
  /** One fixed step. `input` is what the player asked for this step. Returns an event bitmask the
      view can flash on: 1 = damage, 2 = a shade banished, 4 = night cleared, 8 = the grove lost. */
  step(dt, input, auto = false) {
    let events = 0;
    const k = this.keeper;
    this.clock += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.6);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3.2);
    if (this.banner !== null) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    if (this.comboClock > 0) {
      this.comboClock -= dt;
      if (this.comboClock <= 0) this.combo = 0;
    }

    if (this.phase === PHASE.TITLE || this.phase === PHASE.BRIEF || this.phase === PHASE.OVER) {
      this.tickSparks(dt);
      return events;
    }

    if (this.phase === PHASE.DAWN) {
      this.clock += 0;
      this.nightClock += dt;
      this.tickSparks(dt);
      if (this.nightClock > 3.2) {
        if (this.night >= NIGHTS.length) {
          this.phase = PHASE.OVER;
          this.won = true;
          this.overReason = 'The fifth night broke. The fires hold.';
          this.best = Math.max(this.best, this.score);
          events |= 8;
        } else {
          this.startNight();
          events |= 4;
        }
      }
      return events;
    }

    // --- the keeper moves ---
    this.nightClock += dt;
    k.hurtClock = Math.max(0, k.hurtClock - dt);
    k.hurlClock = Math.max(0, k.hurlClock - dt);
    k.hurt = Math.max(0, k.hurt - dt * 2.4);

    let mx = input.x;
    let mz = input.z;
    const mag = Math.hypot(mx, mz);
    if (mag > 1e-6) { mx /= mag; mz /= mag; } else { mx = 0; mz = 0; }
    const wanted = auto ? 1 : 1;
    k.vx += (mx * KEEPER.speed * wanted - k.vx) * Math.min(1, dt * 12);
    k.vz += (mz * KEEPER.speed * wanted - k.vz) * Math.min(1, dt * 12);
    k.x += k.vx * dt;
    k.z += k.vz * dt;

    // Keep the keeper inside the grove and out of the trees it can see.
    const kr = Math.hypot(k.x, k.z);
    if (kr > 29.5) { k.x *= 29.5 / kr; k.z *= 29.5 / kr; }
    for (let i = 0; i < this.props.length; i += 1) {
      const p = this.props[i];
      if (p.kind !== 'tree') continue;
      const dx = k.x - p.x, dz = k.z - p.z;
      const d = Math.hypot(dx, dz);
      const r = 0.62 + p.w * 0.5;
      if (d > 1e-4 && d < r) { k.x = p.x + (dx / d) * r; k.z = p.z + (dz / d) * r; }
    }

    if (!auto && mag > 1e-6) k.facing = Math.atan2(mz, mx);

    // --- the lantern: raised reaches and burns, lowered recovers ---
    const wantRaise = auto ? input.raise : input.raise;
    k.raised = !!wantRaise;
    let drain = KEEPER.idleBurn + (k.raised ? KEEPER.raiseBurn : 0);
    let gain = k.raised ? 0 : KEEPER.passiveGain;
    // Standing in a lit fire's light is the refuge: it is what makes the ring a home.
    for (let i = 0; i < this.fires.length; i += 1) {
      const f = this.fires[i];
      const r = this.fireRadius(f);
      if (r > 0 && dist2(k.x, k.z, f.x, f.z) < r * r) { gain += KEEPER.fireGain; break; }
    }
    // A raised lantern still banks part of a fire's light: without this, wick is only ever
    // spendable, never earnable while you fight, and the ember is not a decision but a trap.
    if (k.raised) gain *= KEEPER.raiseRetain;
    k.wick = Math.max(0, Math.min(KEEPER.wickMax, k.wick - drain * dt + gain * dt));
    if (k.wick <= 0 && !k.raised) {
      this.phase = PHASE.OVER;
      this.won = false;
      this.overReason = 'The wick burnt down to nothing.';
      this.best = Math.max(this.best, this.score);
      events |= 8; events |= 1;
      return events;
    }

    // --- fires burn, gut, and go out ---
    let litCount = 0;
    for (let i = 0; i < this.fires.length; i += 1) {
      const f = this.fires[i];
      f.bite = Math.max(0, f.bite - dt * 1.6);
      f.sway += dt * (1.1 + i * 0.13);
      if (!f.lit) continue;
      f.fuel -= FIRES.drain * dt * (1 + this.night * 0.05);
      if (f.fuel <= 0) {
        f.fuel = 0;
        f.lit = false;
        this.shake = Math.max(this.shake, 0.5);
        this.addSpark(f.x, f.z, 8, 0.2);
      } else {
        litCount += 1;
      }
    }
    if (litCount === 0) {
      this.phase = PHASE.OVER;
      this.won = false;
      this.overReason = 'Every fire went out. The grove is dark.';
      this.best = Math.max(this.best, this.score);
      events |= 8;
      return events;
    }

    // --- the keeper pours the ember into the nearest guttering fire ---
    if (input.pour && !k.raised && k.wick > 6) {
      let target = null;
      let bestD = 100;
      for (let i = 0; i < this.fires.length; i += 1) {
        const f = this.fires[i];
        const d = Math.hypot(k.x - f.x, k.z - f.z);
        if (d < 3.1 && d < bestD) { bestD = d; target = f; }
      }
      if (target !== null) {
        const want = FIRES.pourRate * dt;
        const room = 100 - target.fuel;
        const pour = Math.min(want, room, (k.wick - 4) / FIRES.relightCost);
        if (pour > 0 && target.fuel < 99.99) {
          target.fuel += pour;
          k.wick -= pour * FIRES.relightCost;
          if (!target.lit) { target.lit = true; this.shake = Math.max(this.shake, 0.25); }
          this.addSpark(target.x, target.z, 1, 0.9);
        }
      }
    }

    // --- bolts ---
    for (let i = this.bolts.length - 1; i >= 0; i -= 1) {
      const b = this.bolts[i];
      b.x += b.vx * dt; b.z += b.vz * dt;
      b.life -= dt;
      let hit = false;
      for (let j = 0; j < this.shades.length; j += 1) {
        const s = this.shades[j];
        if (dist2(b.x, b.z, s.x, s.z) < 1.55 * 1.55) {
          s.hp -= 1.7;
          s.hurt = 0.3;
          hit = true;
          break;
        }
      }
      if (hit || b.life <= 0) {
        this.addSpark(b.x, b.z, 4, 1.0);
        this.bolts.splice(i, 1);
      }
    }

    // --- spawning ---
    this.spawnClock += dt;
    while (this.spawnQueue.length > 0 && this.spawnClock >= this.spawnQueue[0].t) {
      this.spawnShade(this.spawnQueue.shift().kind);
    }

    // --- shades ---
    for (let i = this.shades.length - 1; i >= 0; i -= 1) {
      const s = this.shades[i];
      s.hurt = Math.max(0, s.hurt - dt * 3);
      s.bob += dt * 2.4;

      const burn = this.burnAt(s.x, s.z);
      if (burn > 0) {
        s.hp -= burn * dt;
        if (s.hp <= 0) {
          this.banish(s, s.x, s.z);
          events |= 2;
          this.shades.splice(i, 1);
          continue;
        }
      }

      if (s.target === null || s.target === undefined || (s.target.fire && (!s.target.fire.lit || s.target.fire.fuel <= 0)) || s.reaim <= 0) {
        s.target = this.chooseTarget(s);
        s.reaim = 0.9;
      }
      s.reaim = (s.reaim ?? 0) - dt;

      let tx, tz;
      if (s.target.keeper) { tx = k.x; tz = k.z; }
      else { tx = s.target.fire.x; tz = s.target.fire.z; }

      const dx = tx - s.x, dz = tz - s.z;
      const d = Math.hypot(dx, dz) || 1;
      let speed = s.speed;
      if (s.lunge) {
        s.lungeClock -= dt;
        if (s.lungeClock <= 0 && d > 3.4 && d < 9) {
          s.lungeClock = 2.4;
          speed *= 2.5;
        }
      }
      s.x += (dx / d) * speed * dt;
      s.z += (dz / d) * speed * dt;
      // Wisps drift sideways so a wave is a shape to read, not a line to stand in.
      if (s.kind === KIND.WISP) {
        s.x += Math.cos(s.bob) * 0.55 * dt * s.spin * 8;
        s.z += Math.sin(s.bob) * 0.55 * dt * s.spin * 8;
      }

      // Hold at a fire's edge and bite it, but the fire's own light keeps them from closing on it.
      if (s.target.fire) {
        const f = s.target.fire;
        const fr = this.fireRadius(f);
        const dd = Math.hypot(s.x - f.x, s.z - f.z);
        const stop = 1.1 + s.scale * 0.4;
        if (dd < stop) {
          s.biteClock -= dt;
          if (s.biteClock <= 0) {
            s.biteClock = FIRES.biteEvery;
            f.fuel = Math.max(0, f.fuel - FIRES.hitDrain * s.fireDamage);
            f.bite = 1;
            this.shake = Math.max(this.shake, 0.3);
            this.addSpark(f.x, f.z, 5, 0.5);
          }
        }
      }

      // A shade that reaches the keeper takes the wick.
      const dk = Math.hypot(s.x - k.x, s.z - k.z);
      if (dk < 1.0 + s.scale * 0.35 && k.hurtClock <= 0) {
        k.hurtClock = KEEPER.hurtEvery;
        k.wick = Math.max(0, k.wick - KEEPER.hurtWick * s.fireDamage);
        k.hurt = 1;
        this.flash = 1;
        this.shake = Math.max(this.shake, 0.8);
        events |= 1;
        // Knock the shade back so a crowd does not chain-hit the keeper to nothing.
        const push = 2.2;
        s.x += ((s.x - k.x) / (dk || 1)) * push;
        s.z += ((s.z - k.z) / (dk || 1)) * push;
      }
    }

    // --- motes ---
    for (let i = this.motes.length - 1; i >= 0; i -= 1) {
      const m = this.motes[i];
      m.life -= dt;
      const dx = k.x - m.x, dz = k.z - m.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d < KEEPER.magnetRadius) { m.x += (dx / d) * 9 * dt; m.z += (dz / d) * 9 * dt; }
      if (d < 0.7) {
        k.wick = Math.min(KEEPER.wickMax, k.wick + KEEPER.moteGain);
        this.score += Math.round(SCORE.mote * this.comboMul());
        this.motes.splice(i, 1);
        continue;
      }
      if (m.life <= 0) this.motes.splice(i, 1);
    }

    if (this.nightClock >= this.nightLength) {
      let alive = 0;
      for (let i = 0; i < this.fires.length; i += 1) if (this.fires[i].lit && this.fires[i].fuel > 0) alive += 1;
      this.score += SCORE.nightClear + alive * SCORE.fireAtDawn;
      this.phase = PHASE.DAWN;
      this.nightClock = 0;
      this.banner = { text: 'Dawn', life: 3.0, sub: `${alive} of ${FIRES.count} fires still burning` };
      this.best = Math.max(this.best, this.score);
      events |= 4;
    }

    this.tickSparks(dt);
    return events;
  }

  // --- comboMul: the banish-streak score multiplier.
  comboMul() {
    return 1 + Math.min(SCORE.comboMax - 1, this.combo * SCORE.comboStep);
  }

  // --- banish: score the kill and drop the shade's motes.
  banish(shade, x, z) {
    this.combo = Math.min(SCORE.comboMax / SCORE.comboStep, this.combo + 1);
    this.comboClock = SCORE.comboWindow;
    this.score += Math.round(SCORE.banish * shade.motes * this.comboMul());
    for (let i = 0; i < shade.motes; i += 1) {
      const a = (i / shade.motes) * TAU;
      this.motes.push({ x: x + Math.cos(a) * 0.5, z: z + Math.sin(a) * 0.5, life: 9 });
    }
    this.addSpark(x, z, 7 + shade.motes * 3, 0.85);
    this.shake = Math.max(this.shake, 0.34);
  }

  // --- tickSparks: gravity and drag for the spark particles.
  tickSparks(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
      const s = this.sparks[i];
      s.x += s.vx * dt; s.z += s.vz * dt;
      s.vy -= 9.2 * dt; s.y += s.vy * dt;
      s.vx *= 1 - dt * 1.6; s.vz *= 1 - dt * 1.6;
      s.life -= dt;
      if (s.life <= 0 || s.y < 0) this.sparks.splice(i, 1);
    }
  }
}
