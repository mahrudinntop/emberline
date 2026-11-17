<!-- README.md — hand-authored for this entry. -->
# Emberline — Keeper of the Dying Fires

A single-screen attention-management game. Five fires stand in a dark grove. You are the keeper, and
you carry the only light: a lantern that has to be raised to hold a fire alive, and a wick that is the
whole of your budget. You cannot be in two places. Every second spent at one fire is a second another
fire spends going out.

Play in a browser: open `game/index.html`. No build step, no network request, no dependency to install.

## The loop

- **Five fires, one keeper.** Fires only stay lit while you are near them. Walk away and they gutter:
  nine seconds of dark takes a fire.
- **Raise the lantern (hold the mouse button).** Light is a held commitment, not a toggle. While you
  hold, a fire burns steady and the wick drains.
- **Hurl an ember (click).** A ranged relight, for the fire on the far side of the grove you cannot
  reach in time. It costs wick and it is imprecise: it buys you a few seconds, not a rescue.
- **The wick is the clock.** The wick bar is what actually runs out. When it does, every fire you left
  behind goes dark at once.
- **Five nights.** Each night adds a wave of shades that drink light. Score is fires kept, night
  reached, and how much of the wick you had left when it ended.

## What is in this repository

```
game/                 the whole game: index.html + ES modules, vendored three.js, no bundler
  src/palette.js      every colour in the game, in one place: value bands, no pure black or white
  src/config.js       tuning constants: rates, radii, view, night length, scoring
  src/world.js        the simulation: fires, fuel, shades, wick, scoring, phases. No rendering.
  src/grove.js        the diorama: terrain, pines, braziers, the shared additive lightmap, the keeper
  src/input.js        hold-to-raise and click-to-hurl, with a hold threshold so they never collide
  src/hud.js          the DOM HUD: fire pips, wick, night, score
  src/audio.js        procedural audio, no asset files
  src/pilot.js        a deterministic pilot: it plays the real rules, used to stage screenshots
  src/shots.js        `?shot=start|play|end&seed=N` staging, so screenshots are reproducible
  src/main.js         boot, renderer, fixed-step loop
tools/shot.py         headless-Chromium screenshot runner (Playwright)
tools/look.py         art-direction pass: sends frames to a vision model for cr
screenshots/          the three frames the judge sees, generated from the real build
main.ts, vendor/      the make.fun program entrypoint and its vendored library
```

## Design notes

**The rules and the picture are the same grove.** `world.reset()` decides where the fires, pines and
rocks stand; `grove.js` draws exactly those props and nothing else. Earlier the renderer scattered its
own props, which let the grove look crowded while the rules believed it empty — two worlds, one
screen, and the player loses to a rock that is not in the simulation.

**One additive lightmap, not five glow sprites.** Each fire's ground glow is drawn into a single
256×256 canvas, blurred once, and cast as one quad. Five separate billboards had straight edges where
they met; one sheet has nothing to seam against. It refreshes at most ten times a second, not per
frame.

**Occlusion subtracts; light only adds.** The additive sheet has each prop's footprint punched out of
it with `destination-out`, so the ground is darkest under a prop and light ramps away. An additive
quad cannot do this — adding can only ever brighten, which is why the base of a prop used to be the
brightest pixel in the frame and the grove read as props pasted onto a gradient.

**The camera is world-locked, and it never calls `lookAt()`.** `lookAt()` tilts the camera's heading,
which quietly breaks every pixel-to-ground measurement the layout depends on: the yaw is set directly
and pitch is solved with `atan2`.

**Screenshots are staged, not screenshotted by hand.** `?shot=play&seed=29` runs the deterministic
pilot through the real rules for 38 seconds, so the mid-play frame is a real game state — real fuel
levels, real shades, real score — reachable by pressing the same keys.

## Running it

```sh
node serve.ts          # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # builds out/dossier.json
```

Screenshots: `tools/shot.py '<url>?shot=play&seed=29' out.png` with a headless Chromium available.

## Controls

| Input | Action |
| --- | --- |
| W A S D / arrows | move the keeper |
| hold left mouse | raise the lantern (holds a nearby fire) |
| click | hurl an ember at the nearest dark fire |
| R / Enter | restart |

MIT licensed.
