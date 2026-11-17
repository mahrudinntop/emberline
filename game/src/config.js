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
  { length: 92, wisp: 22, stalker: 9, bearer: 3, gap: 1.0 },
  { length: 102, wisp: 26, stalker: 11, bearer: 5, gap: 0.92 },
];

/* --- the five-night arc, then the deep grove -------------------------------------------------
   Clearing the fifth night is an ending, not the end: the same rules keep escalating on a repeat
   curve so a run has a shape beyond the fixed campaign — the first time the player can lose to a
   night they have never seen. Each repeat draws from one of three moods, so the deep grove is
   varied without a single new rule to learn. */
export const ENDLESS = {
  nightLength: 112,     // at night six and after, a night runs this long
  growth: 0.16,         // extra shades per repeat, compounding
  gapFloor: 0.72,       // the spawn gap never drops below this
  gapDecay: 0.94,       // spawn gap multiplier per repeat
};

/* --- two presses that were asked for: hold the grove still, and silence it --- */
export const PAUSE_KEY = 'KeyP';
export const MUTE_KEY = 'KeyM';

/* --- the offerings: one choice is made between nights, and it is the whole progression --------
   Three themes, each a small set of named boons. A theme is always represented on the table, so
   every choice is between three different kinds of power; the specific boon within a theme is
   drawn fresh, which means a long run can double down on one axis. Effects are plain numbers read
   by world.js, so a boon is data plus one line in chooseBoon and nothing else. */
export const BOONS = [
  // --- the wick: how long the keeper can stand in the dark
  { theme: 'Wick', items: [
    { id: 'deep-well',    name: 'Deep Well',      text: '+25 wick capacity, and the wick mends a little faster.' },
    { id: 'quick-mend',   name: 'Quick Mend',     text: 'The wick recovers far faster with the lantern lowered.' },
    { id: 'steady-hand',  name: 'Steady Hand',    text: 'The lantern wastes less wick while it is raised.' },
    { id: 'long-carry',   name: 'Long Carry',     text: 'A raised lantern keeps far more of a fire’s light.' },
  ] },
  // --- the fire: how much the ring survives on its own
  { theme: 'Fire', items: [
    { id: 'banked-coals', name: 'Banked Coals',   text: 'Every fire drains a third slower all night.' },
    { id: 'wide-light',   name: 'Wide Light',     text: 'A lit fire throws its light noticeably further.' },
    { id: 'thick-wood',   name: 'Thick Wood',     text: 'A shade bite takes less fuel from a fire.' },
    { id: 'first-light',  name: 'First Light',    text: 'Every night opens with the ring already banked.' },
  ] },
  // --- the ember: how hard the keeper hits back
  { theme: 'Ember', items: [
    { id: 'hot-blade',    name: 'Hot Blade',      text: 'The raised lantern burns shades much harder.' },
    { id: 'wide-reach',   name: 'Wide Reach',     text: 'The raised lantern reaches further into the dark.' },
    { id: 'big-blast',    name: 'Big Blast',      text: 'Hurled embers strike harder and cost less wick.' },
    { id: 'long-lure',    name: 'Long Lure',      text: 'A raised lantern pulls shades from further off.' },
  ] },
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
