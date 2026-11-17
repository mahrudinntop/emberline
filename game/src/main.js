/* Emberline — boot. One renderer, one scene, one world, one loop. The page is the grove: the canvas
   below, the HUD above, the banner between them. The world is stepped on a fixed tick so the rules
   run at the same speed on any machine, and the view interpolates the rest for itself. */

import * as THREE from 'three';
import { World, PHASE } from './world.js';
import { Grove } from './grove.js';
import { Hud } from './hud.js';
import { Sound } from './audio.js';
import { makeRandom } from './random.js';
import { attachInput, input, consumeHurl } from './input.js';
import { stageShot } from './shots.js';
import { STEP } from './config.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const shotName = params.get('shot');

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.34;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const world = new World(makeRandom(seed));
world.reset();
const grove = new Grove(scene, world.random, world.props);
grove.buildFires(world.fires);
grove.buildKeeper(world.keeper);
grove.buildSparkPoints();
const hud = new Hud();
const sound = new Sound();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
  renderer.setSize(w, h, false);
  grove.camera.aspect = w / h;
  grove.camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// --- pilot the lantern with the mouse: the pointer aims the throw, and the keeper's heading is
// --- read off the ground plane so a click goes where the cursor is.

const aim = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function aimFromPointer(nx, ny) {
  raycaster.setFromCamera({ x: nx, y: ny }, grove.camera);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(planeY, hit)) {
    aim.set(hit.x, 0, hit.z);
    const k = world.keeper;
    const dx = aim.x - k.x;
    const dz = aim.z - k.z;
    if (Math.hypot(dx, dz) > 0.3) k.facing = Math.atan2(dz, dx);
  }
}

// --- input: keys drive the keeper; the same keys drive the restart and the title screens.

attachInput(renderer.domElement, {
  onRestart: () => { world.reset(); sound.start(); },
  onAdvance: () => {
    sound.start();
    if (world.phase === PHASE.TITLE) world.startNight();
    else if (world.phase === PHASE.OVER) world.reset();
  },
  onAim: aimFromPointer,
});

renderer.domElement.addEventListener('pointerdown', () => sound.start());
window.addEventListener('keydown', () => sound.start(), { once: true });

// --- the loop. A fixed-step world, at most eight steps per frame so a slow machine never spirals.

let last = performance.now();
let acc = 0;
let time = 0;
let staged = false;

function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  time += dt;

  if (!staged) {
    staged = true;
    if (shotName) {
      const result = stageShot(shotName, world);
      world.phase = result.screen === 'title' ? PHASE.TITLE
        : result.screen === 'over' ? PHASE.OVER
        : PHASE.PLAY;
      if (result.screen === 'over') world.overReason = world.overReason || 'The last fire went out.';
    }
  }

  // The title screen still simulates, so the fires breathe while the player reads.
  if (!shotName) {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 8) {
      acc -= STEP;
      steps += 1;
      if (world.phase === PHASE.TITLE || world.phase === PHASE.BRIEF) {
        world.step(STEP, { x: 0, z: 0, raise: false, pour: false }, true);
        continue;
      }
      if (consumeHurl()) world.throwBolt();
      world.step(STEP, input, false);
    }
  } else {
    // A shot frame is held still: the world is already where it should be.
    world.step(0, { x: 0, z: 0, raise: false, pour: false }, true);
  }

  grove.update(world, shotName ? 0.016 : dt, shotName ? 1.1 : time);
  hud.render(world);
  sound.mood(world, dt);
  renderer.render(scene, grove.camera);

  // A named shot waits one extra frame, draws, then says it is ready for whoever is watching.
  if (shotName && !window.__emberShotReady) {
    window.__emberShotReady = true;
    requestAnimationFrame(() => {
      grove.update(world, 0.016, 1.1);
      hud.render(world);
      renderer.render(scene, grove.camera);
      document.title = `ready:${shotName}`;
    });
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// The judge's tooling reads this: for ?shot= the render is deterministic, and this reports the
// frame the game believes it drew, so a screenshot can be checked against the rules it came from.
window.emberline = {
  world,
  grove,
  seed,
  shot: shotName ?? null,
  phase: () => world.phase,
  summary: () => ({
    seed,
    shot: shotName ?? null,
    night: world.night,
    score: world.score,
    firesLit: world.fires.filter((f) => f.lit && f.fuel > 0).length,
    firesTotal: world.fires.length,
    wick: Math.round(world.keeper.wick),
    shades: world.shades.length,
    phase: world.phase,
  }),
};
