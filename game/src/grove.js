/* Emberline — the diorama. One ground disc, a ring of pines, five braziers, and the light that
   comes out of them. Every surface is drawn from the palette's value bands; the ground texture is
   painted at boot on a canvas (so the game still loads from files alone) and carries the five faint
   ember-lines that run from the middle of the grove to each fire: the paths the keeper walks. */

import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { VIEW, GROVE } from './config.js';

function groundTexture() {
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const g = cv.getContext('2d');

  // Base: cold ash-slate.
  g.fillStyle = '#242b34';
  g.fillRect(0, 0, size, size);
  // Lift the floor so grain and cracks live in the 8-30% band where the eye can actually find them.
  g.fillStyle = 'rgba(176, 188, 205, 0.030)';
  g.fillRect(0, 0, size, size);

  // A few soft light/dark patches so no two areas match — but the ground's texture is carried by
  // directional ash streaks, not round blobs: wind-combed ash runs one way, so the surface reads as
  // material instead of a polka field of ellipses.
  for (let i = 0; i < 16; i += 1) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 30 + Math.random() * 60;
    const light = Math.random() < 0.45;
    const grad = g.createRadialGradient(x, y, 2, x, y, r);
    const c = light ? '120, 132, 146' : '16, 21, 28';
    grad.addColorStop(0, `rgba(${c}, ${0.04 + Math.random() * 0.05})`);
    grad.addColorStop(1, `rgba(${c}, 0)`);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Wind-combed streaks: long faint parallel sweeps, the grain direction the eye reads as surface.
  g.lineCap = 'round';
  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * size, y = Math.random() * size;
    const len = 26 + Math.random() * 90;
    const a = 0.62 + (Math.random() - 0.5) * 0.24;   // one prevailing direction
    const light = Math.random() < 0.5;
    g.strokeStyle = light
      ? `rgba(128, 140, 154, ${0.028 + Math.random() * 0.05})`
      : `rgba(14, 18, 24, ${0.04 + Math.random() * 0.07})`;
    g.lineWidth = 0.8 + Math.random() * 1.6;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(
      x + Math.cos(a + 0.12) * len * 0.5, y + Math.sin(a + 0.12) * len * 0.5,
      x + Math.cos(a) * len, y + Math.sin(a) * len,
    );
    g.stroke();
  }

  // Grain: thousands of specks, both directions of value.
  for (let i = 0; i < 5200; i += 1) {
    const x = Math.random() * size, y = Math.random() * size;
    const v = Math.random();
    g.fillStyle = v < 0.5 ? `rgba(18, 23, 30, ${0.10 + v * 0.3})` : `rgba(96, 108, 122, ${0.06 + (v - 0.5) * 0.24})`;
    g.fillRect(x, y, 1.4, 1.4);
  }

  // Hairline cracks in the ash.
  g.strokeStyle = 'rgba(12, 16, 22, 0.22)';
  g.lineWidth = 1;
  for (let i = 0; i < 34; i += 1) {
    let x = Math.random() * size, y = Math.random() * size;
    let a = Math.random() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k += 1) {
      a += (Math.random() - 0.5) * 1.1;
      x += Math.cos(a) * (8 + Math.random() * 16);
      y += Math.sin(a) * (8 + Math.random() * 16);
      g.lineTo(x, y);
    }
    g.stroke();
  }

  const cx = size / 2;

  // The five ember-lines: faint worn paths from the middle toward each fire, stopping short so
  // they read as footpaths, not beams.
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r0 = size * 0.065;
    const r1 = size * 0.215;
    g.strokeStyle = 'rgba(140, 105, 70, 0.15)';
    g.lineWidth = 3.6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r0, cx + Math.sin(a) * r0);
    g.quadraticCurveTo(
      cx + Math.cos(a + 0.16) * (r0 + r1) / 2, cx + Math.sin(a + 0.16) * (r0 + r1) / 2,
      cx + Math.cos(a) * r1, cx + Math.sin(a) * r1,
    );
    g.stroke();
  }

  // The moon is the one light the scene admits to, so every dark mark on this ground is thrown by
  // it: a smeared, offset stain, not a concentric ring. A ring of five identical circles was the
  // thing that read as stickers; a directional smear reads as a shadow on a surface.
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.07 * i;
    const fx = cx + Math.cos(a) * size * 0.292;
    const fy = cx + Math.sin(a) * size * 0.292;
    const w = 30 + (i % 3) * 7;
    const dir = -0.42 + i * 0.09;
    const grad = g.createRadialGradient(fx, fy, 2, fx + Math.sin(dir) * 9, fy + Math.cos(dir) * 9, w);
    grad.addColorStop(0, 'rgba(15, 11, 8, 0.62)');
    grad.addColorStop(0.55, 'rgba(20, 15, 11, 0.26)');
    grad.addColorStop(1, 'rgba(20, 15, 11, 0)');
    g.fillStyle = grad;
    g.save();
    g.translate(fx, fy);
    g.rotate(dir);
    g.scale(1, 0.62);
    g.fillRect(-w, -w, w * 2, w * 2);
    g.restore();
  }

  // Contact occlusion, painted INTO the albedo before any light exists, so the additive glow of the
  // braziers can never wash it back out. A 45%-black ellipse, offset a couple of pixels "up" from each
  // fire, with a smaller core pressed hard under the iron: that pair is what makes a prop sit on a floor
  // instead of float over it.
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const fx = cx + Math.cos(a) * size * 0.292;
    const fy = cx + Math.sin(a) * size * 0.292;
    const blobW = 40, blobH = 21;
    g.save();
    g.translate(fx, fy - 3);
    g.scale(1, blobH / blobW);
    const occl = g.createRadialGradient(0, 0, 1, 0, 0, blobW / 2);
    occl.addColorStop(0, 'rgba(6, 8, 12, 0.55)');
    occl.addColorStop(0.5, 'rgba(6, 8, 12, 0.34)');
    occl.addColorStop(1, 'rgba(6, 8, 12, 0)');
    g.fillStyle = occl;
    g.beginPath();
    g.arc(0, 0, blobW / 2, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const core = g.createRadialGradient(fx, fy - 1, 1, fx, fy - 1, 11);
    core.addColorStop(0, 'rgba(4, 5, 8, 0.72)');
    core.addColorStop(1, 'rgba(4, 5, 8, 0)');
    g.fillStyle = core;
    g.fillRect(fx - 11, fy - 12, 22, 22);
  }

  // Soft dark rim so the disc's edge sinks into the fog.
  const rim = g.createRadialGradient(cx, cx, size * 0.30, cx, cx, size * 0.5);
  rim.addColorStop(0, 'rgba(10, 13, 18, 0)');
  rim.addColorStop(1, 'rgba(10, 13, 18, 0.88)');
  g.fillStyle = rim;
  g.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function contactShadow(size, opacity = 0.42) {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(8, 10, 14, ${opacity})`);
  grad.addColorStop(0.55, `rgba(8, 10, 14, ${opacity * 0.55})`);
  grad.addColorStop(1, 'rgba(8, 10, 14, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

function glowSprite(inner, outer) {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.4, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({
    map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

// Three torch silhouettes: height multiplier, width multiplier, sideways lean, and a small offset off
// the bowl so the flame does not look punched through the same hole every time.
const TORCH_SHAPES = [
  { h: 1.28, w: 0.74, lean: 0.02, ox: 0.0, oz: 0.0 },   // tall, thin taper
  { h: 0.78, w: 1.30, lean: -0.03, ox: 0.02, oz: 0.0 }, // squat, wide brazier
  { h: 1.02, w: 0.95, lean: 0.20, ox: -0.05, oz: 0.02 },// leaning torch
];

/** The one additive lightmap: every fire's ground glow is drawn into this single canvas with a single
 *  radial falloff each, then the whole sheet goes through one pass of shadowBlur. Five separate
 *  billboards gave five hard-edged quads with visible straight seams; one blurred sheet with soft
 *  falloff cannot have a seam, because there is nothing to seam against. */
function makeLightmap() {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false, opacity: 0.0,
  });
  return { cv, tex, mat, s };
}



export class Grove {
  constructor(scene, random, props) {
    this.scene = scene;
    this.random = random;

    scene.background = new THREE.Color(PALETTE.voidMid);
    scene.fog = new THREE.FogExp2(PALETTE.voidMid, 0.013);

    this.camera = new THREE.PerspectiveCamera(VIEW.fov, 16 / 9, 0.1, 220);
    // Our own pivot, not the camera's: the rig places this group, and the camera keeps a FIXED yaw in
    // world space. lookAt() would tilt the camera and put its heading off-angle, which quietly breaks
    // every measurement made by raycasting a pixel back onto the ground plane.
    this.rig = new THREE.Group();
    this.rig.rotation.y = VIEW.yaw;
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = 0;
    this.camera.rotation.x = Math.atan2(VIEW.cameraFrom[1] - VIEW.cameraLook[1],
      Math.hypot(VIEW.cameraFrom[0] - VIEW.cameraLook[0], VIEW.cameraFrom[2] - VIEW.cameraLook[2]));
    scene.add(this.rig);
    this.rig.add(this.camera);
    const cd = Math.hypot(
      VIEW.cameraFrom[0] - VIEW.cameraLook[0],
      VIEW.cameraFrom[1] - VIEW.cameraLook[1],
      VIEW.cameraFrom[2] - VIEW.cameraLook[2],
    );
    this.camera.position.set(0, 0, cd);

    // One cold moon overhead and a dim fill so no face is ever lost entirely.
    const moon = new THREE.DirectionalLight(0xbcd2e8, 0.78);
    moon.position.set(-14, 26, 10);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -44; moon.shadow.camera.right = 44;
    moon.shadow.camera.top = 44; moon.shadow.camera.bottom = -44;
    moon.shadow.camera.far = 140;
    moon.shadow.bias = -0.0008;
    scene.add(moon);
    scene.add(new THREE.HemisphereLight(0x3b566e, 0x202a33, 1.55));

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(34, 96),
      new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.96, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // All fire light goes onto one additive sheet, so it must exist before the braziers are built.
    this.lm = makeLightmap();
    this.lmAcc = 0;
    this.lmMesh = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), this.lm.mat);
    this.lmMesh.rotation.x = -Math.PI / 2;
    this.lmMesh.position.y = 0.02;
    this.lmMesh.renderOrder = 4;
    this.lmMesh.frustumCulled = false;
    scene.add(this.lmMesh);

    this.buildFurniture(props || []);
    this.buildAsh();
    this.fires = [];
    this.keeperRig = null;
    this.shadeRigs = new Map();
    this.boltMeshes = [];
    this.moteMeshes = [];
    this.sparkPoints = null;
  }

  buildFurniture(props) {
    // Render THE SIM's own props: one set of pines and rocks exists, in world.reset(), and the diorama
    // draws exactly those. Before, the render scattered its own and the rules scattered another set,
    // which is how a grove could look crowded while the rules believed it empty.
    const r = this.random;
    this.props = [];
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1, 6);
    const crownGeo = new THREE.ConeGeometry(1, 2.4, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 1 });
    const crownA = new THREE.MeshStandardMaterial({ color: 0x18202b, roughness: 1 });
    const crownB = new THREE.MeshStandardMaterial({ color: 0x1f2a38, roughness: 1 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.95 });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);

    // Instanced: the ring of pines is one draw call per material.
    const trees = props.filter((q) => q.kind === 'tree');
    const rocks = props.filter((q) => q.kind === 'rock');
    const n = trees.length;
    this.treeTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, n);
    this.treeCrownsA = new THREE.InstancedMesh(crownGeo, crownA, n);
    this.treeCrownsB = new THREE.InstancedMesh(crownGeo, crownB, n);
    this.treeTrunks.castShadow = true;
    this.treeCrownsA.castShadow = true;
    this.treeCrownsB.castShadow = true;
    this.treeTrunks.receiveShadow = true;
    this.treeCrownsA.receiveShadow = true;
    this.treeCrownsB.receiveShadow = true;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3();
    for (let i = 0; i < n; i += 1) {
      const p = trees[i];
      const h = p.h;
      const a = p.t;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
      pos.set(p.x, h * 0.32, p.z);
      m.compose(pos, q, one.clone().multiply(new THREE.Vector3(p.w, h * 0.34, p.w)));
      this.treeTrunks.setMatrixAt(i, m);
      pos.set(p.x, h * 0.78, p.z);
      m.compose(pos, q, one.clone().multiply(new THREE.Vector3(p.w * 1.15, h * 0.30, p.w * 1.15)));
      this.treeCrownsA.setMatrixAt(i, m);
      const cw = p.w * 0.85;
      pos.set(p.x, h * 1.06, p.z);
      m.compose(pos, q, one.clone().multiply(new THREE.Vector3(cw, h * 0.26, cw)));
      this.treeCrownsB.setMatrixAt(i, m);
    }
    this.scene.add(this.treeTrunks, this.treeCrownsA, this.treeCrownsB);

    const rn = rocks.length;
    this.rocks = new THREE.InstancedMesh(rockGeo, rockMat, rn);
    this.rocks.castShadow = true;
    for (let i = 0; i < rn; i += 1) {
      const p = rocks[i];
      pos.set(p.x, p.h * 0.4, p.z);
      q.setFromEuler(new THREE.Euler(0.1, p.t, 0.12));
      m.compose(pos, q, one.clone().multiply(new THREE.Vector3(p.w, p.h, p.w)));
      this.rocks.setMatrixAt(i, m);
    }
    this.scene.add(this.rocks);
  }

  buildAsh() {
    const n = 620;
    const r = this.random;
    const pos = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const p = r.inDisc(34, 0);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = r.range(0.4, 14);
      pos[i * 3 + 2] = p.z;
      seeds[i] = r.float();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.ashSeeds = seeds;
    this.ashGeo = geo;
    const mat = new THREE.PointsMaterial({
      color: 0x7d92a8, size: 0.10, transparent: true, opacity: 0.20, depthWrite: false, sizeAttenuation: true,
    });
    this.ash = new THREE.Points(geo, mat);
    this.scene.add(this.ash);
  }

  /** The five braziers. Each owns a light, a flame that leans with the wind, and a glow sprite. */
  buildFires(fires) {
    const bowlGeo = new THREE.CylinderGeometry(0.75, 0.5, 0.5, 10);
    const stemGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.9, 8);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x33302e, roughness: 0.85, metalness: 0.3 });
    // Three genuinely different flame solids, not one cone at three scales. Scaling a single cone is
    // the thing that reads as "instanced prop" no matter how wide the scale spread: the silhouette
    // curve itself has to differ, so these vary the radial segments, the taper, and the tip.
    const FLAME_GEOS = [
      new THREE.ConeGeometry(0.52, 2.35, 7),   // tall narrow taper
      new THREE.ConeGeometry(0.78, 1.42, 5),   // squat wide blaze
      new THREE.ConeGeometry(0.44, 1.95, 9),   // fine many-sided candle
    ];
    for (let i = 0; i < fires.length; i += 1) {
      const f = fires[i];
      const g = new THREE.Group();
      const stem = new THREE.Mesh(stemGeo, ironMat);
      stem.position.y = 0.45; stem.castShadow = true;
      const bowl = new THREE.Mesh(bowlGeo, ironMat);
      bowl.position.y = 1.1; bowl.castShadow = true;
      // Per-fire colour temperature and brightness: one torch burns slightly greener at the base,
      // another hotter at the tip. Five identical ambers is the other half of "cloned".
      const hue = (f.seed % 5) / 5;
      const flameMat = new THREE.MeshStandardMaterial({
        color: PALETTE.emberDeep,
        emissive: new THREE.Color().setHSL(0.055 + hue * 0.020, 0.88, 0.52 + hue * 0.05),
        emissiveIntensity: 0.92 + ((f.seed % 4) / 4) * 0.48,
        roughness: 0.6,
      });
      const flame = new THREE.Mesh(FLAME_GEOS[i % FLAME_GEOS.length], flameMat);
      // THREE silhouettes, chosen per fire: a tall thin taper, a squat wide brazier, a leaning torch.
      // Scaling one cone was the thing that made five fires read as five copies of one decal; three real
      // shapes with different aspect ratios stay distinct even at forty pixels tall.
      const shape = TORCH_SHAPES[i % TORCH_SHAPES.length];
      // Wide spread on purpose: at roughly forty pixels tall, a 10% height difference reads as one
      // asset instanced five times. The spread has to survive the downscale to be worth having.
      const fh = 0.70 + ((f.seed % 7) / 7) * 0.75;
      const fw = 0.70 + ((f.seed % 5) / 5) * 0.70;
      flame.scale.set(fw * shape.w, fh * shape.h, fw * shape.w);
      flame.rotation.z = shape.lean;
      flame.rotation.y = (f.seed % 11) * 0.57;
      flame.position.set(shape.ox, 1.65 + fh * 0.30, shape.oz);
      const coreMat = new THREE.MeshStandardMaterial({
        color: PALETTE.emberCore, emissive: PALETTE.emberCore, emissiveIntensity: 0.95, roughness: 0.4,
      });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.13 + shape.w * 0.09, 10, 8), coreMat);
      core.position.y = 1.72 + fh * 0.30;
      // NO glow sprite per fire: five billboards with five hard-edged quads was exactly the "straight
      // light-plane" defect. All fire light now goes into one soft additive ground lightmap instead.
      const light = new THREE.PointLight(PALETTE.emberGlow, 46, 20, 1.9);
      light.position.y = 2.1;
      // Contact occlusion for the brazier is painted into the ground albedo (see groundTexture), so
      // the additive sheet cannot wash it out. Nothing else is needed under a fire.
      g.add(stem, bowl, flame, core, light);
      g.position.set(f.x, 0, f.z);
      this.scene.add(g);
      this.fires.push({ group: g, flame, core, halo: null, light, bowl, shape });
    }
  }

  buildKeeper(keeper) {
    const g = new THREE.Group();
    // The keeper is the subject, so the silhouette has to survive a forty-pixel downscale: one dark
    // bell body, a small hooded head (not a balloon), two visible shoulders that carry the arm, and a
    // lantern held OFF the body so its glow never fuses with the cloak's edge. The earlier version had
    // no arms at all — the lantern floated beside a featureless sphere and the whole figure read as
    // an orb, which is why five braziers out-read the protagonist.
    const DARK = 0x0b0f14;
    const cloakMat = new THREE.MeshStandardMaterial({
      color: DARK, roughness: 0.70, emissive: 0x131c28, emissiveIntensity: 0.55,
    });
    // Bell body: narrow shoulders flaring to a wide hem — the read is "standing", not "floating".
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.72, 1.45, 12), cloakMat);
    body.position.y = 0.80; body.castShadow = true;
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.80, 0.16, 12), cloakMat);
    hem.position.y = 0.09; hem.castShadow = true;
    // Shoulders: a bar wide enough that the arm's root is visibly attached to the torso.
    const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.40, 4, 8), cloakMat);
    shoulders.rotation.z = Math.PI / 2;
    shoulders.position.y = 1.46; shoulders.castShadow = true;
    // Hooded head: small, and the hood cone closes over it so it never reads as a pale ball.
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), cloakMat);
    head.position.y = 1.70; head.castShadow = true;
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.44, 12), cloakMat);
    hood.position.y = 1.82; hood.castShadow = true;
    // A single pale face-plane deep inside the hood: the only bright note on the figure, and small.
    // It faces +Z, the same way the model's own forward is, so the keeper has a readable heading.
    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x9a8763, roughness: 0.88, emissive: 0x1f1a10, emissiveIntensity: 0.18 }),
    );
    face.position.set(0, 1.70, 0.13);
    face.scale.set(1, 1.05, 0.55);
    // The holding arm: shoulder -> elbow -> wrist, three segments so the lantern has a visible grip.
    // A near-black arm on a near-black cloak is one silhouette — the sleeve keeps its own mid tone so
    // firelight puts a visible edge on it, which is what makes 'carrying' read at forty pixels.
    const armMat = new THREE.MeshStandardMaterial({ color: 0x6b5638, roughness: 0.55 });
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.42, 4, 8), armMat);
    upper.position.set(0.46, 1.34, 0.02); upper.rotation.z = -0.30; upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.44, 4, 8), armMat);
    fore.position.set(0.86, 1.06, 0.02); fore.rotation.z = -1.22; fore.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), armMat);
    hand.position.set(1.16, 0.98, 0.02); hand.castShadow = true;
    // The lantern hangs from the hand, clear of the body: a wire, a glass box, a cage.
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.36, 0.26),
      new THREE.MeshStandardMaterial({
        color: PALETTE.lanternGlass, emissive: PALETTE.lanternGlass, emissiveIntensity: 0.85, roughness: 0.3,
      }),
    );
    glass.position.set(1.22, 0.55, 0.02);
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.42, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6, metalness: 0.4, wireframe: true }),
    );
    cage.position.copy(glass.position);
    // A dedicated rim light behind the keeper, aimed forward: this is the value break that pulls the
    // black cloak off the mid-value ground without brightening the whole figure. It travels with the
    // group, so the silhouette always has one lit edge wherever the keeper walks.
    const rim = new THREE.PointLight(0xffc98a, 12.0, 7.0, 2.2);
    rim.position.set(-0.7, 1.5, -1.1);
    const lampLight = new THREE.PointLight(0xffd9a0, 6.0, 10, 2.0);
    lampLight.position.copy(glass.position);
    // The lantern is a small warm light, never the brightest surface in the frame: it is capped well
    // under the flame cores and tinted toward the amber of the grove, so it cannot drag the palette
    // cool or out-value the fires it is supposed to be serving.
    const lampHalo = new THREE.Sprite(glowSprite('rgba(255,221,168,0.42)', 'rgba(150,112,64,0.16)'));
    lampHalo.scale.set(2.6, 2.6, 1);
    lampHalo.position.copy(glass.position);
    const keeperBlob = contactShadow(1, 0.5);
    keeperBlob.scale.set(1.7, 1.15, 1);
    keeperBlob.position.y = 0.03;
    g.add(body, hem, shoulders, head, hood, face, upper, fore, hand, glass, cage, lampLight, rim, lampHalo, keeperBlob);
    this.keeperRig = {
      group: g, glass, cage, lampLight, lampHalo, cloak: body, head, blob: keeperBlob,
    };
    this.scene.add(g);
  }

  /** A shade rig: one dark droplet body, two pale eyes, one faint cold halo. */
  buildShade(shade) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 10),
      new THREE.MeshStandardMaterial({
        color: PALETTE.shade, roughness: 0.65, metalness: 0.1,
        emissive: 0x101826, emissiveIntensity: 0.7, transparent: true, opacity: 0.92,
      }),
    );
    body.scale.set(1, 1.18, 0.9);
    body.position.y = 0.75;
    body.castShadow = true;
    const eyeMat = new THREE.MeshStandardMaterial({
      color: PALETTE.shadeEye, emissive: PALETTE.shadeEye, emissiveIntensity: 2.2, roughness: 0.3,
    });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), eyeMat);
    eyeL.position.set(-0.16, 0.95, 0.42);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.16;
    const halo = new THREE.Sprite(glowSprite('rgba(120,150,190,0.5)', 'rgba(58,74,99,0.22)'));
    halo.scale.set(2.6, 2.6, 1);
    halo.position.y = 0.8;
    const blob = contactShadow(1, 0.4);
    blob.scale.set(1.7, 1.15, 1);
    blob.position.y = 0.03;
    g.add(body, eyeL, eyeR, halo, blob);
    g.scale.setScalar(shade.scale);
    this.scene.add(g);
    const rig = { group: g, body, halo };
    this.shadeRigs.set(shade, rig);
    return rig;
  }

  dropShade(shade) {
    const rig = this.shadeRigs.get(shade);
    if (rig) {
      this.scene.remove(rig.group);
      this.shadeRigs.delete(shade);
    }
  }

  boltMesh() {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 6),
      new THREE.MeshStandardMaterial({
        color: PALETTE.emberCore, emissive: PALETTE.emberGlow, emissiveIntensity: 2.6, roughness: 0.4,
      }),
    );
    const halo = new THREE.Sprite(glowSprite('rgba(255,201,120,0.95)', 'rgba(217,105,31,0.4)'));
    halo.scale.set(2.4, 2.4, 1);
    m.add(halo);
    return m;
  }

  moteMesh() {
    const m = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({
        color: PALETTE.emberGlow, emissive: PALETTE.emberGlow, emissiveIntensity: 2.0, roughness: 0.4,
      }),
    );
    const halo = new THREE.Sprite(glowSprite('rgba(255,178,87,0.9)', 'rgba(120,70,30,0.35)'));
    halo.scale.set(1.8, 1.8, 1);
    m.add(halo);
    return m;
  }

  buildSparkPoints(max = 260) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(max * 3), 3));
    const mat = new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.sparkMax = max;
    this.sparkPoints = new THREE.Points(geo, mat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);
  }

    /** Redraw every fire's ground glow into the one additive sheet. Called only when something actually
   *  flickers or a fire changes state, and at most a few times a second — this is a 256x256 canvas, not
   *  a per-frame job. */
  redrawLightmap(world) {
    const { cv, tex, mat, s } = this.lm;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, s, s);
    const scale = s / 68; // sheet covers 68 world units, centred on the grove
    let any = 0;
    for (let i = 0; i < world.fires.length; i += 1) {
      const f = world.fires[i];
      if (!f.lit || f.fuel <= 0) continue;
      const health = Math.max(0, Math.min(1, f.fuel / 100));
      const r = (world.fireRadius(f) * 1.85 + 4.2) * scale;
      const x = (f.x + 34) * scale;
      const y = (f.z + 34) * scale;
      const flick = 0.94 + Math.sin(f.sway * 5.3) * 0.05;
      g.globalAlpha = (0.68 + health * 0.32) * flick;
      // Two-stage falloff instead of one soft gradient. A single radial blob per fire was the reason
      // the whole frame read as "one gradient repeated everywhere": every light had the same softness,
      // so nothing was crisp and there was no depth hierarchy. A tight near-opaque core with a real
      // rim, then a wide weak spill, gives the ground a defined edge at the fire's foot.
      const core = g.createRadialGradient(x, y, 0, x, y, r * 0.46);
      core.addColorStop(0, 'rgba(255,176,92,0.42)');
      core.addColorStop(0.62, 'rgba(242,140,58,0.30)');
      core.addColorStop(0.88, 'rgba(198,102,42,0.15)');
      core.addColorStop(1, 'rgba(150,74,30,0)');
      g.fillStyle = core;
      g.beginPath();
      g.arc(x, y, r * 0.46, 0, Math.PI * 2);
      g.fill();
      const spill = g.createRadialGradient(x, y, r * 0.38, x, y, r);
      spill.addColorStop(0, 'rgba(198,104,46,0.16)');
      spill.addColorStop(0.55, 'rgba(150,76,32,0.07)');
      spill.addColorStop(1, 'rgba(110,52,20,0)');
      g.fillStyle = spill;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      any += 1;
    }
    g.globalAlpha = 1;
    // Occlusion erases, it never adds. Each prop punches a small honest hole in the accumulative
    // sheet using blend 'destination-out', which REMOVES alpha instead of writing colour. An additive
    // quad cannot do this: adding can only ever brighten, so the base of the prop always ended up the
    // brightest pixel in the frame. Here the base of every prop is the darkest, which is the signal
    // the eye actually reads as "standing on".
    // Directional cast shadow: every prop and fire throws a soft shadow the SAME way (away from the
    // moon), painted as REMOVAL so the additive pool can never brighten it back. One shape, drawn
    // 9 times max per refresh, keeps this inside the 10 Hz budget.
    const shA = Math.atan2(-0.40, 0.62); // one global shadow vector for the whole grove
    const shLen = 1.75 * scale;          // short: a fire's shadow must not reach its neighbour's pool
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < world.fires.length; i += 1) {
      const f = world.fires[i];
      if (!f.lit || f.fuel <= 0) continue;
      const x = (f.x + 34) * scale;
      const y = (f.z + 34) * scale;
      const sx = x + Math.cos(shA) * shLen;
      const sy = y + Math.sin(shA) * shLen;
      const sr = 2.2 * scale;
      const sh = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sh.addColorStop(0, 'rgba(0,0,0,0.34)');
      sh.addColorStop(0.6, 'rgba(0,0,0,0.16)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sh;
      g.beginPath();
      g.ellipse(sx, sy, sr * 1.05, sr * 0.52, shA, 0, Math.PI * 2);
      g.fill();
    }
    const dp = (world.props || []);
    for (let i = 0; i < dp.length; i += 1) {
      const p = dp[i];
      const ro = (p.kind === 'tree' ? (p.w || 1) * 1.25 : 1.25) * scale;
      const x = (p.x + 34) * scale;
      const y = (p.z + 34) * scale;
      const hole = g.createRadialGradient(x, y, 0, x, y, ro);
      hole.addColorStop(0, 'rgba(0,0,0,0.60)');
      hole.addColorStop(0.72, 'rgba(0,0,0,0.44)');
      hole.addColorStop(0.88, 'rgba(0,0,0,0.16)');
      hole.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hole;
      g.beginPath();
      g.arc(x, y, ro, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // One blur pass over the whole sheet: this is what removes every straight edge at once. The blur
    // runs BEFORE the occlusion is re-applied, so the holes stay tight instead of smearing out.
    if (any > 0) {
      const blur = document.createElement('canvas');
      blur.width = s; blur.height = s;
      const bg = blur.getContext('2d');
      bg.filter = 'blur(7px)';
      bg.drawImage(cv, 0, 0);
      g.clearRect(0, 0, s, s);
      g.drawImage(blur, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < dp.length; i += 1) {
        const p = dp[i];
        const ro = (p.kind === 'tree' ? (p.w || 1) * 1.25 : 1.25) * scale;
        const x = (p.x + 34) * scale;
        const y = (p.z + 34) * scale;
        const hole = g.createRadialGradient(x, y, 0, x, y, ro);
        hole.addColorStop(0, 'rgba(0,0,0,0.60)');
        hole.addColorStop(0.72, 'rgba(0,0,0,0.44)');
        hole.addColorStop(0.88, 'rgba(0,0,0,0.16)');
        hole.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = hole;
        g.beginPath();
        g.arc(x, y, ro, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    mat.opacity = 1.0;
    tex.needsUpdate = true;
  }

  /** Per-frame visual update: fires lean and flicker, the keeper faces its course, the ash falls,
      the camera breathes. Reads state, changes nothing. */
  update(world, dt, time) {
    // Fires.
    for (let i = 0; i < world.fires.length; i += 1) {
      const f = world.fires[i];
      const rig = this.fires[i];
      if (!rig) continue;
      const health = Math.max(0, f.fuel / 100);
      const radius = world.fireRadius(f);
      const lean = Math.sin(f.sway * 1.9) * 0.12 + Math.sin(f.sway * 4.3) * 0.06;
      rig.flame.rotation.z = rig.shape.lean + lean;
      rig.flame.rotation.x = Math.cos(f.sway * 2.3) * 0.1;
      // Flicker modulates around the silhouette: the shape is permanent, the motion is alive.
      const flick = 0.92 + Math.sin(f.sway * 6.1) * 0.05 + Math.sin(f.sway * 13.7) * 0.03;
      const s = (0.72 + health * 0.42) * flick;
      rig.flame.scale.set(rig.shape.w * s, rig.shape.h * (0.55 + health * 0.62) * flick, rig.shape.w * s);
      rig.flame.visible = f.lit && f.fuel > 0;
      rig.core.visible = rig.flame.visible;
      rig.core.position.y = 1.85 + Math.sin(f.sway * 5.1) * 0.05;
      // The ground light lives in the additive lightmap plane, not in a per-fire billboard.
      rig.light.intensity = f.lit ? 12 + health * 34 + Math.sin(f.sway * 7.7) * 2.4 : 0;
      rig.light.distance = Math.max(6, radius * 1.65);
    }

    // The ground lightmap: one blurred additive sheet for all five fires, refreshed only when a fire
    // flickers or changes state — a few times a second, not every frame.
    this.lmAcc += dt;
    if (this.lm && this.lmAcc > 0.1) {
      this.lmAcc = 0;
      this.redrawLightmap(world);
    }

    // The keeper.
    const k = world.keeper;
    if (this.keeperRig) {
      const rig = this.keeperRig;
      rig.group.position.set(k.x, 0, k.z);
      // Face the direction of travel; while raising the lantern, face the throw line instead.
      const face = k.raised ? k.facing : Math.atan2(k.vz, k.vx);
      if (Math.hypot(k.vx, k.vz) > 0.4 || k.raised) {
        rig.group.rotation.y += (face - rig.group.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI === 0 ? 0 : 0;
        // +X is the model's arm side, so add a quarter turn to align it with the travel heading.
        rig.group.rotation.y = face + Math.PI / 2;
      }
      const bob = Math.sin(time * 9) * 0.05 * Math.min(1, Math.hypot(k.vx, k.vz));
      rig.group.position.y = Math.abs(bob);
      // The keeper is the subject: scale it up so the eye lands on it before the braziers do.
      rig.group.scale.setScalar(1.34);
      const raise = k.raised ? 1 : 0;
      rig.glass.position.y = 0.62 + raise * 0.5;
      rig.cage.position.copy(rig.glass.position);
      rig.lampLight.position.copy(rig.glass.position);
      rig.lampHalo.position.copy(rig.glass.position);
      const wickT = Math.max(0, Math.min(1, k.wick / 100));
      rig.lampLight.intensity = k.raised ? 8.6 + wickT * 5.4 : 3.4 + wickT * 2.6;
      rig.lampLight.distance = world.keeperRadius() * 1.45;
      // Hard ceiling: the raised lantern tops out at 0.80 of full value, i.e. below every flame core.
      rig.lampHalo.scale.setScalar(k.raised ? 3.0 + wickT * 0.9 : 2.1 + wickT * 0.5);
      rig.lampHalo.material.opacity = Math.min(0.46, 0.22 + wickT * 0.20);
      rig.glass.material.emissiveIntensity = Math.min(0.80, 0.34 + wickT * 0.42 + (k.hurt > 0 ? Math.sin(time * 40) * 0.16 : 0));
      rig.cloak.scale.setScalar(1 + k.hurt * 0.06);
    }

    // Shades.
    for (const [shade, rig] of this.shadeRigs) {
      rig.group.position.set(shade.x, 0, shade.z);
      rig.group.position.y = Math.sin(shade.bob * 2.1) * 0.12;
      const stretch = 1 + Math.sin(shade.bob * 3.3) * 0.08;
      rig.body.scale.set(1, 1.18 * stretch, 0.9);
      const hurt = shade.hurt > 0 ? 1 : 0;
      rig.body.material.emissiveIntensity = 0.7 + hurt * 1.6;
      rig.halo.material.opacity = 0.55 + hurt * 0.3;
    }

    // Bolts and motes.
    while (this.boltMeshes.length < world.bolts.length) this.boltMeshes.push(this.scene.add(this.boltMesh()));
    while (this.moteMeshes.length < world.motes.length) this.moteMeshes.push(this.scene.add(this.moteMesh()));
    for (let i = 0; i < this.boltMeshes.length; i += 1) {
      const b = world.bolts[i];
      const m = this.boltMeshes[i];
      if (!b) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(b.x, 1.05, b.z);
      const stretch = Math.min(2.2, Math.hypot(b.vx, b.vz) / 14);
      m.scale.set(1, 1, 1 + stretch);
      m.lookAt(b.x + b.vx, 1.05, b.z + b.vz);
    }
    for (let i = 0; i < this.moteMeshes.length; i += 1) {
      const mo = world.motes[i];
      const m = this.moteMeshes[i];
      if (!mo) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(mo.x, 0.55 + Math.sin(time * 4 + i) * 0.12, mo.z);
      m.rotation.y = time * 2.2 + i;
      m.rotation.x = time * 1.4;
    }

    // Sparks: write the live ones into the points buffer, park the rest below the floor.
    if (this.sparkPoints) {
      const pos = this.sparkPoints.geometry.attributes.position;
      const col = this.sparkPoints.geometry.attributes.color;
      const n = Math.min(this.sparkMax, world.sparks.length);
      for (let i = 0; i < n; i += 1) {
        const s = world.sparks[i];
        pos.setXYZ(i, s.x, s.y, s.z);
        const t = Math.max(0, Math.min(1, s.life / s.max));
        const warm = s.warmth;
        col.setXYZ(i, 1.0 * t, (0.55 + 0.35 * warm) * t, (0.15 + 0.25 * warm) * t);
      }
      for (let i = n; i < this.sparkMax; i += 1) pos.setXYZ(i, 0, -50, 0);
      pos.needsUpdate = true;
      col.needsUpdate = true;
    }

    // Ash drifts down and a little east, and wraps.
    const pos = this.ashGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const seed = this.ashSeeds[i];
      let y = pos.getY(i) - dt * (0.35 + seed * 0.5);
      let x = pos.getX(i) + Math.sin(time * 0.6 + seed * 12) * dt * 0.5 + dt * 0.22;
      let z = pos.getZ(i);
      if (y < 0.1) { y = 13 + seed * 2; const p = this.random.inDisc(33, 2); x = p.x; z = p.z; }
      if (x > 34) x = -34;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;

    // One raking light: every pine in the frame throws its shadow the SAME way. Directional light
    // with a wide frustum + PCF shadow map, aimed across the grove from the upper left, gives the
    // floor the direction that five round glows never could.
    if (!this.rake) {
      const rake = new THREE.DirectionalLight(0x35506b, 0.85);
      rake.position.set(-26, 34, -14);
      rake.target.position.set(0, 0, 0);
      rake.castShadow = true;
      rake.shadow.mapSize.set(2048, 2048);
      rake.shadow.camera.left = -40; rake.shadow.camera.right = 40;
      rake.shadow.camera.top = 40; rake.shadow.camera.bottom = -40;
      rake.shadow.camera.far = 120;
      rake.shadow.bias = -0.0012;
      this.scene.add(rake);
      this.scene.add(rake.target);
      this.rake = rake;
    }

    // Camera: a slow lean toward the keeper's quadrant, plus shake on hits.
    const look = new THREE.Vector3(k.x * 0.22, 0, k.z * 0.22);
    this.rig.position.lerp(look, Math.min(1, dt * 2.2));
    const sway = Math.sin(time * 0.4) * VIEW.sway * 0.4;
    this.camera.position.x = VIEW.cameraFrom[0] + sway + (Math.random() - 0.5) * world.shake * 0.5;
    this.camera.position.y = VIEW.cameraFrom[1] + (Math.random() - 0.5) * world.shake * 0.3;
    this.camera.lookAt(this.rig.position);

    // Mood: the background cools as fires die, warms at dawn.
    let litHealth = 0;
    for (let i = 0; i < world.fires.length; i += 1) {
      const f = world.fires[i];
      if (f.lit) litHealth += Math.max(0, Math.min(1, f.fuel / 100));
    }
    litHealth /= world.fires.length;
    const cold = new THREE.Color(PALETTE.voidDeep);
    const warm = new THREE.Color(0x1c2130);
    const target = cold.clone().lerp(warm, litHealth * 0.9);
    if (world.phase === 'dawn') target.lerp(new THREE.Color(0x3a3040), 0.5);
    this.scene.background.lerp(target, Math.min(1, dt * 1.5));
    this.scene.fog.color.copy(this.scene.background);
  }
}
