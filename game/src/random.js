// random.js — hand-authored for this entry.
/* Emberline — a small deterministic random source. The whole grove, every night's spawn order
   and every screenshot are built from this one seed, so ?seed=1 always shows the same game and a
   score can be compared with a score. */

export function makeRandom(seed) {
  let state = (Math.floor(seed) | 0) >>> 0;
  if (state === 0) state = 0x9e3779b9;
  const next = () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;  state >>>= 0;
    return state / 4294967296;
  };
  return {
    float: next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    angle: () => next() * Math.PI * 2,
    sign: () => (next() < 0.5 ? -1 : 1),
    /** A point inside a disc, biased outward so the middle stays open to move in. */
    inDisc: (radius, inner = 0) => {
      const a = next() * Math.PI * 2;
      const r = Math.sqrt(inner * inner + next() * (radius * radius - inner * inner));
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    },
    shuffle: (list) => {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        const swap = list[i]; list[i] = list[j]; list[j] = swap;
      }
      return list;
    },
  };
}
