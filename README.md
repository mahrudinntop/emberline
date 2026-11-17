[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/mahrudinntop/emberline/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/mahrudinntop/emberline/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

<!-- README.md — hand-authored for this entry. -->
# Emberline — Keeper of the Dying Fires

A single-screen attention-management game. Five fires stand in a dark grove. You are the keeper, and
you carry the only light: a lantern that has to be raised to hold a fire alive, and a wick that is the
whole of your budget. You cannot be in two places. Every second spent at one fire is a second another
fire spends going out.

Play in a browser: open `game/index.html`. No build step, no network request, no dependency to install.

## The loop

- **Five fires, one keeper, about sixteen units apart.** Fires blink out on their own fuel in roughly
  two and a half minutes, three times faster with a shade chewing on them. Walk away from a fire and
  it keeps burning — you are not its battery, you are its repair crew.
- **Pour the wick to heal a fire (stand close, no raise).** Your wick is the repair budget and the
  fires' fuel is the health bar. Pouring is the *only* way either currency goes up: pouring refills a
  fire, standing in a lit fire's light refills you. That trade is the entire economy.
- **Raise the lantern (hold the mouse button).** Light is a held commitment, not a toggle. Raised,
  the lantern burns a wide disc — everything inside it takes damage every second, all at once. It is
  the only way to kill a shade: a thrown ember is 15 wick for 1.7 damage against a wisp that has 1
  health, so hurling can only slow a wave, never clear one.
- **A raised lantern is bait.** Shades within eleven units abandon their fires and come for you, and
  fires near your raised light get a big discount on being attacked. A keeper standing raised between
  two chewed fires is a wall: the wave walks into the light and burns.
- **The wick is the clock.** Not a countdown — a battery you spend to fight and refill by standing in
  light. Raise too long and you run dry with no light left to bank against. Never raise and every fire
  eventually starves. The tension is exactly that.
- **Five nights.** Each night a longer wave of wisp, stalker and bearer. Score is shades banished,
  fires kept, night reached, and wick left when it ended.
- **Between the nights, an offering.** Every dawn lays three boons on the table — a pick of the
  Ember, Wick and Fire themes. Ember boons sharpen the lantern (reach, burn, blast), Wick boons
  thicken the budget (capacity, mend, banked coals), Fire boons widen the light the fires throw.
  A run is twelve boons deep at most; the build chips down the left of the HUD read back what you
  chose. Holding a full table to the fifth dawn is a legitimate way to lose: the shades do not wait.
- **The deep grove.** After the fifth dawn the run does not end unless you want it to: `E` walks past
  the fifth night into an endless grove where every night is the hardest night. The score keeps
  counting; the fires do not care that you won.
- **Pause, sound, and a memory.** `P` holds the night exactly where it is (the world stops stepping;
  the banner says so). `M` mutes. Best score and runs played persist in `localStorage` — the title
  and victory screens read them back, so a session is a ladder of runs, not one night.

## What is in this repository

```
game/                 the whole game: index.html + ES modules, vendored three.js, no bundler
  src/palette.js      every colour in the game, in one place: value bands, no pure black or white
  src/config.js       tuning constants: rates, radii, view, night length, scoring, boons, endless
  src/world.js        the simulation: fires, fuel, shades, wick, boons, scoring, phases. No rendering.
  src/grove.js        the diorama: terrain, pines, braziers, the shared additive lightmap, the keeper
  src/input.js        hold-to-raise and click-to-hurl, with a hold threshold so they never collide
  src/hud.js          the DOM HUD: fire pips, wick, night, score
  src/audio.js        procedural audio, no asset files
  src/pilot.js        a deterministic pilot: it plays the real rules, used to stage screenshots
  src/shots.js        `?shot=start|play|end&seed=N` staging, so screenshots are reproducible
  src/main.js         boot, renderer, fixed-step loop
tools/shot.py         headless-Chromium screenshot runner (Playwright)
tools/look.py         art-direction pass: sends frames to a vision model for cr
screenshots/          the four frames the judge sees, generated from the real build
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

**Screenshots are staged, not screenshotted by hand.** `?shot=play&seed=5` runs the deterministic
pilot through the real rules for 26 seconds, so the mid-play frame is a real game state — real fuel
levels, real shades, real score. The `end` frame plays the whole run out in one continuous stream
under the same pilot and captures the *victory* screen: five fires still burning at dawn. Nothing is
painted on afterwards; the phase machine reaches `over` with `won === true` under its own rules.

**The PILOT is the regression test.** `tools/sweep.mjs 32` replays the real rules headlessly under
the autopilot and counts wins. It is what proved the game was unwinnable before the tuning pass: a
night-one budget of 233 wick of ambient fire burn plus up to 218 wick of shade bites against a
maximum income of 304 wick is a deficit no player can close. The same harness now reports 30/32
wins on the retuned economy (two losses at the fifth night, kept on purpose so the finale has teeth), and `tools/budget.mjs` derives that arithmetic straight from `config.js` so it can never drift
out of step with the tuning.

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
| 1 / 2 / 3, or click a card | take a boon at dawn |
| E | walk into the deep grove (endless) from the victory screen |
| P | pause |
| M | mute |
| R / Enter | restart |

MIT licensed.
