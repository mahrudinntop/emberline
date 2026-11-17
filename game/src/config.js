// config.js — hand-authored for this entry.
/* Emberline — every number the game balances with, in one place, so a tuning pass never has to
   chase a constant through the modules. Distances are world units (the grove is 26 in radius),
   times are seconds, fuel and wick are 0..100. */

export const GROVE = {
  radius: 26,
  trees: 74,
  rocks: 16,
};

export const FIRES = {
  count: 5,
  ring: 11.2,          // fires closer: one raised lantern can bridge the ring
  drain: 0.62,          // fuel lost per second while lit
  hitDrain: 4.5,        // fuel a shade bite takes
  biteEvery: 1.15,
  relightCost: 0.34,    // wick per point of fuel poured
  pourRate: 24,         // fuel points per second poured at close range
  lightMin: 6.5,
  lightMax: 15.5,
};

export const KEEPER = {
  speed: 7.4,
  wick: 100,
  wickMax: 100,
  idleBurn: 0.55,       // wick lost per second, always
  raiseBurn: 4.6,       // extra wick per second while the lantern is raised
  passiveGain: 1.05,    // wick regained per second while the lantern is lowered
  fireGain: 6.2,        // extra wick per second while standing in a lit fire's light
  raiseRetain: 0.45,    // fraction of a fire's light the raised lantern still banks (see world.js)
  hurtWick: 12,         // wick a shade bite takes
  hurtEvery: 0.9,
  raiseRadius: 10.5,   // one keeper can defend three fires at once
  burnPerSecond: 1.05,  // shade damage while held in raised light
  hurlCost: 15,
  hurlSpeed: 21,
  hurlBlast: 3.4,
  hurlCooldown: 0.55,
  moteGain: 14,
  magnetRadius: 2.6,
};

export const SHADES = {
  wisp:    { speed: 3.4, hp: 1.0,  motes: 1, scale: 1.0, fireDamage: 1.0 },
  stalker: { speed: 2.7, hp: 2.0,  motes: 2, scale: 1.45, fireDamage: 1.0, lunge: true },
  bearer:  { speed: 1.7, hp: 3.6,  motes: 4, scale: 2.1, fireDamage: 2.0 },
};

export const NIGHTS = [
  { length: 62, wisp: 14, stalker: 2, bearer: 0, gap: 1.7 },
  { length: 72, wisp: 18, stalker: 5, bearer: 0, gap: 1.45 },
  { length: 82, wisp: 20, stalker: 7, bearer: 2, gap: 1.25 },
  { length: 92, wisp: 18, stalker: 7, bearer: 3, gap: 1.2 },
  { length: 102, wisp: 20, stalker: 8, bearer: 4, gap: 1.05 },
];

export const SCORE = {
  banish: 10,
  mote: 2,
  fireAtDawn: 40,
  nightClear: 150,
  comboWindow: 2.5,
  comboStep: 0.1,
  comboMax: 3,
};

export const VIEW = {
  fov: 35,
  // Camera yaw is fixed in WORLD space (no lookAt tilt), so a prop can be placed on the ground by
  // raycasting the very pixel it must cover: what the layout code measures is what the frame shows.
  yaw: (() => { const f = [0, 25.5, 30.0], t = [0, 0.4, 0.6]; return Math.atan2(f[0] - t[0], f[2] - t[2]); })(),
  cameraFrom: [0, 15.5, 19.5],
  cameraLook: [0, 1.1, 2.2],
  sway: 0.30,
};

export const STEP = 1 / 60;
