/* Emberline — the whole look is built from these numbers, so every surface keeps to one palette
   and the game reads as one diorama rather than a pile of defaults. Colours are laid out as
   value bands (deep, mid, near, glow) so a shape's role decides its brightness, not the order it
   happens to be drawn in. */

export const PALETTE = {
  // The dark the player fights: never pure black, so shapes stay readable inside it.
  voidDeep: 0x0d1017,
  voidMid: 0x141a24,
  voidNear: 0x1d2531,
  ground: 0x232c39,
  groundLit: 0x35414f,

  // The fires: warm amber rising to a nearly white core.
  emberCore: 0xffe9b8,
  emberGlow: 0xffb257,
  emberDeep: 0xd9691f,
  emberSmoke: 0x5a3a24,

  // The keeper and the lantern: cooler, to read apart from the fires.
  keeper: 0xc9d6e4,
  keeperShade: 0x8296ab,
  lanternGlass: 0x9fe6ff,
  lanternRing: 0x4f6b7d,

  // The shades: cold, drained, deliberately not red.
  shade: 0x3a4a63,
  shadeEye: 0xb9dcff,
  shadeEdge: 0x6d86a8,
};

/** Per-material shading multipliers, so one palette still gives each face its own value step. */
export const SHADE = {
  top: 1.0,
  side: 0.72,
  front: 0.56,
};

/** A linear lightness lift used by emissive-looking rings drawn over the dark floor. */
export function glowValue(distance, radius) {
  if (radius <= 0) return 0;
  const t = Math.max(0, Math.min(1, 1 - distance / radius));
  return t * t * (3 - 2 * t);
}
