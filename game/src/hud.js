// hud.js — hand-authored for this entry.
/* Emberline — the interface drawn over the grove: the fire pips, the wick bar, the night clock, the
   banner, and the thin gold frame that keeps the whole diorama feeling lit from within. All of it
   is plain DOM over the canvas, so the text stays crisp at any size and the screenshot reads as a
   finished game rather than a raw canvas. */

import { FIRES, NIGHTS, BOONS } from './config.js';

// --- the run, in words: the name of a boon, the line under the title, the best score ever seen.
const NAME_BY_ID = new Map(BOONS.flatMap((theme) => theme.items.map((item) => [item.id, item.name])));
function boonName(id) { return NAME_BY_ID.get(id) ?? id; }

function bestEver(world) {
  const m = world.meta ?? {};
  return Math.max(m.best ?? 0, world.score ?? 0);
}

function bannerTipFor(world) {
  const m = world.meta ?? {};
  if ((m.runs ?? 0) > 0 && (m.best ?? 0) > 0) {
    return `Best score ${m.best} over ${m.runs} ${m.runs === 1 ? 'night watch' : 'night watches'}. The deep grove opens past the fifth night.`;
  }
  return 'Five fires. One wick. Nine seconds of dark takes a fire the moment you look away.';
}
import { PHASE } from './world.js';

const el = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.pips = el('fire-pips');
    this.wickFill = el('wick-fill');
    this.clockValue = el('clock-value');
    this.banner = el('banner');
    this.bannerTitle = el('banner-title');
    this.bannerSub = el('banner-sub');
    this.bannerKeys = el('banner-keys');
    this.bannerTip = el('banner-tip');
    this.status = el('status');
    this.nightTag = el('night-tag');
    this.buildBoons = el('build-boons');
    this.offers = el('offers');
    this.offersRow = el('offers-row');
    this.pauseTag = el('pause-tag');
    this.muteTag = el('mute-tag');
    this.lastPip = -1;
    this.lastPhase = null;
    this.lastTaken = -1;
    this.lastBuildKey = null;
    this.lastOffers = null;
    this.pipNodes = [];
    for (let i = 0; i < FIRES.count; i += 1) {
      const pip = document.createElement('span');
      pip.className = 'pip';
      this.pips.appendChild(pip);
      this.pipNodes.push(pip);
    }
  }

  render(world) {
    // Fire pips: lit, guttering or out, one class per pip.
    for (let i = 0; i < this.pipNodes.length; i += 1) {
      const f = world.fires[i];
      const node = this.pipNodes[i];
      const health = f.lit ? Math.max(0, Math.min(1, f.fuel / 100)) : 0;
      let cls = 'pip';
      if (!f.lit || f.fuel <= 0) cls += ' out';
      else if (health < 0.3) cls += ' low';
      else if (health < 0.6) cls += ' mid';
      node.className = cls;
      node.style.setProperty('--fill', (health * 100).toFixed(1) + '%');
    }

    const wick = Math.max(0, Math.min(1, world.keeper.wick / world.wickMax()));
    this.wickFill.style.width = (wick * 100).toFixed(1) + '%';
    this.wickFill.className = wick < 0.22 ? 'low' : wick < 0.5 ? 'mid' : '';

    const remain = Math.max(0, world.nightLength - world.nightClock);
    if (world.phase === PHASE.PLAY) {
      const mm = Math.floor(remain / 60);
      const ss = Math.floor(remain % 60);
      this.clockValue.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    } else if (world.phase === PHASE.DAWN) {
      this.clockValue.textContent = 'DAWN';
    } else if (world.phase === PHASE.OVER) {
      this.clockValue.textContent = world.won ? 'HELD' : 'DARK';
    }

    this.renderBanner(world);
    this.renderOffers(world);
    this.renderBuild(world);

    if (this.nightTag) this.nightTag.textContent = `NIGHT ${Math.max(1, world.night)}`;
    const spoken = `${FIRES.count} fires, ${world.fires.filter((f) => f.lit && f.fuel > 0).length} burning. ` +
      `Wick ${Math.round(world.keeper.wick)} percent. Score ${world.score}. Night ${world.night}.`;
    if (spoken !== this.status.textContent) this.status.textContent = spoken;
  }

  // --- renderOffers: the three cards between nights. Rebuilt only when a new table is laid,
  // --- so a held frame never re-renders its own choices.
  renderOffers(world) {
    const show = world.phase === PHASE.PICK && world.offers !== null;
    this.offers.classList.toggle('hidden', !show);
    if (!show) return;
    if (this.lastOffers === world.offers) return;
    this.lastOffers = world.offers;
    this.offersRow.textContent = '';
    world.offers.forEach((o, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'offer';
      card.dataset.index = String(i);
      const index = document.createElement('span');
      index.className = 'offer-index';
      index.textContent = `${i + 1}`;
      const theme = document.createElement('span');
      theme.className = 'offer-theme';
      theme.textContent = o.theme;
      const name = document.createElement('span');
      name.className = 'offer-name';
      name.textContent = o.name;
      const text = document.createElement('p');
      text.className = 'offer-text';
      text.textContent = o.text;
      card.append(index, theme, name, text);
      this.offersRow.appendChild(card);
    });
  }

  // --- renderBuild: the boons taken, as chips, so the run's growth is always on the page.
  renderBuild(world) {
    const key = world.taken.join('|');
    if (this.lastBuildKey === key) return;
    this.lastBuildKey = key;
    this.lastTaken = world.taken.length;
    this.buildBoons.textContent = '';
    for (let i = 0; i < world.taken.length; i += 1) {
      const chip = document.createElement('span');
      chip.className = 'boon-chip';
      chip.textContent = boonName(world.taken[i]);
      this.buildBoons.appendChild(chip);
    }
  }

  renderBanner(world) {
    const b = world.banner;
    const show = b !== null && (world.phase === PHASE.PLAY || world.phase === PHASE.DAWN || world.phase === PHASE.BRIEF);
    const titleScreen = world.phase === PHASE.TITLE;
    const overScreen = world.phase === PHASE.OVER;

    if (!show && !titleScreen && !overScreen) {
      this.banner.classList.add('hidden');
      return;
    }
    this.banner.classList.remove('hidden');

    // A stale banner after a transition is replaced by the screen that owns the phase.
    if (titleScreen) {
      this.banner.classList.remove('over', 'dawn');
      this.bannerTitle.textContent = 'Emberline';
      this.bannerSub.textContent = 'Keeper of the Dying Fires';
      this.bannerKeys.textContent = 'WASD move  ·  hold mouse to raise the lantern  ·  click to hurl an ember  ·  Space pours the wick  ·  P pause  ·  M sound  ·  R restarts  ·  Enter begins';
      this.bannerTip.textContent = bannerTipFor(world);
      return;
    }
    if (overScreen) {
      this.banner.classList.add('over');
      this.banner.classList.remove('dawn');
      this.bannerTitle.textContent = world.won ? 'The Fires Hold' : 'The Grove Is Dark';
      this.bannerSub.textContent = world.overReason;
      const runShape = world.endless
        ? `Night reached: ${world.night} (deep grove)`
        : `Nights held: ${world.night} / ${NIGHTS.length}`;
      this.bannerKeys.textContent = `Fires kept: ${world.fires.filter((f) => f.lit && f.fuel > 0).length} / ${FIRES.count}   ·   ${runShape}   ·   Score ${world.score}   ·   Best ${bestEver(world)}`;
      this.bannerTip.textContent = world.won
        ? 'Press E to walk the deep grove, or R to begin again.'
        : 'Press R or Enter to light the first fire again.';
      return;
    }
    this.banner.classList.remove('over');
    if (world.phase === PHASE.DAWN) this.banner.classList.add('dawn');
    else this.banner.classList.remove('dawn');
    this.bannerTitle.textContent = b.text;
    this.bannerSub.textContent = b.sub ?? '';
    this.bannerKeys.textContent = '';
    this.bannerTip.textContent = '';
  }
}
