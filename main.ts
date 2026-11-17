// Emberline entry point. Node 22, standard library only.
//
// The deliverable is assembled here: game/ (the playable build, plain ES modules served
// straight from disk, no bundler, no network) and screenshots/ (three renders captured by
// tools/shot.py through the game's own deterministic ?shot= scenes) are copied into the
// output directory, and dossier.json is generated from them via the vendored makefun
// library. Outside the judge's container the output directory comes from
// MAKEFUN_OUTPUT_DIR; inside it, the platform sets /output.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts   # dev preview at http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Hard caps from the scorer's gate: they are checked here first so the run fails loudly
// with a readable message instead of an intake refusal with no context.
const CAPS = {
  screenshotMax: 4,
  screenshotMaxBytes: 262_144,
  gameMaxFiles: 993,
  gameMaxBytes: 50_331_648,
  gamePathMaxBytes: 1_000,
  textMaxBytes: 163_840,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: CAPS.textMaxBytes,
    screenshots: { max: CAPS.screenshotMax, max_bytes: CAPS.screenshotMaxBytes },
    game_max_files: CAPS.gameMaxFiles,
    game_max_bytes: CAPS.gameMaxBytes,
    game_path_max_bytes: CAPS.gamePathMaxBytes,
  }),
);
