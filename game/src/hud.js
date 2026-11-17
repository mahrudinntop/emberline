/* Emberline — the interface drawn over the grove: the fire pips, the wick bar, the night clock, the
   banner, and the thin gold frame that keeps the whole diorama feeling lit from within. All of it
   is plain DOM over the canvas, so the text stays crisp at any size and the screenshot reads as a
   finished game rather than a raw canvas. */

import { FIRES, NIGHTS } from './config.js';
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
    this.lastPip = -1;
    this.lastPhase = null;
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

    const wick = Math.max(0, Math.min(1, world.keeper.wick / 100));
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

    if (this.nightTag) this.nightTag.textContent = `NIGHT ${Math.max(1, world.night)}`;
    const spoken = `${FIRES.count} fires, ${world.fires.filter((f) => f.lit && f.fuel > 0).length} burning. ` +
      `Wick ${Math.round(world.keeper.wick)} percent. Score ${world.score}. Night ${world.night}.`;
    if (spoken !== this.status.textContent) this.status.textContent = spoken;
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
      this.bannerKeys.textContent = 'WASD move  ·  hold mouse to raise the lantern  ·  click to hurl an ember  ·  Space pours the wick  ·  R restarts  ·  Enter begins';
      this.bannerTip.textContent = 'Five fires. One wick. Nine seconds of dark takes a fire the moment you look away.';
      return;
    }
    if (overScreen) {
      this.banner.classList.add('over');
      this.banner.classList.remove('dawn');
      this.bannerTitle.textContent = world.won ? 'The Fires Hold' : 'The Grove Is Dark';
      this.bannerSub.textContent = world.overReason;
      this.bannerKeys.textContent = `Fires kept: ${world.fires.filter((f) => f.lit && f.fuel > 0).length} / ${FIRES.count}   ·   Night reached: ${world.night} / ${NIGHTS.length}   ·   Score ${world.score}`;
      this.bannerTip.textContent = 'Press R or Enter to light the first fire again.';
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
