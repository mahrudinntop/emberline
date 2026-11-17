// audio.js — hand-authored for this entry.
/* Emberline — sound, all of it made on the spot: no audio files, so the game still loads from its
   own directory with nothing fetched. A loop of filtered wind, a crackle bed under each lit fire,
   small struck tones for banishing, a low horn for the night, bells for the dawn, and a heartbeat
   that starts when the wick runs thin. Every voice is a plain oscillator or a noise buffer through
   the standard WebAudio graph. */

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.windGain = null;
    this.crackles = [];
    this.started = false;
    this.heartClock = 0;
  }

  /** Browsers allow audio only after a gesture: this runs on the first key or click. */
  start() {
    if (this.started) return;
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return;
    this.started = true;
    const ctx = this.ctx = new AC();
    const master = this.master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    // Wind: looped pink-ish noise through a slow bandpass wander.
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = noise;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 0.6;
    const windGain = this.windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start();
    this.windLfo(ctx, windFilter);

    this.noiseBuffer = noise;
  }

  windLfo(ctx, filter) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.85;
  }

  /** The wind rises with the night number: a small dread dial the player feels before they read it. */
  mood(world, dt) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const windTarget = 0.08 + world.night * 0.03;
    this.windGain.gain.setTargetAtTime(windTarget, t, 0.8);
    this.heartClock -= dt;
    if (world.phase === 'play' && world.keeper.wick < 26 && this.heartClock <= 0) {
      this.heartClock = 0.9;
      this.thump();
    }
  }

  blip(freq, dur, type, gain, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noiseHit(dur, freq, gain) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  throwWhoosh() { this.noiseHit(0.24, 900, 0.5); this.blip(520, 0.18, 'triangle', 0.1, 240); }
  banish(chain) {
    const scale = [523, 587, 659, 784, 880];
    const n = scale[Math.min(scale.length - 1, chain % scale.length)];
    this.blip(n, 0.32, 'sine', 0.22);
    this.blip(n * 2, 0.2, 'sine', 0.06);
  }
  bite() { this.noiseHit(0.14, 240, 0.5); this.blip(120, 0.2, 'sawtooth', 0.16, 60); }
  hurt() { this.blip(180, 0.3, 'square', 0.2, 70); this.noiseHit(0.2, 160, 0.5); }
  pour() { this.blip(300, 0.12, 'triangle', 0.09, 420); }
  nightHorn() {
    this.blip(98, 1.4, 'sawtooth', 0.16, 82);
    this.blip(147, 1.2, 'sine', 0.1, 123);
  }
  dawnBells() {
    const bells = [523, 659, 784, 1047];
    bells.forEach((f, i) => setTimeout(() => this.blip(f, 0.9, 'sine', 0.16), i * 170));
  }
  lose() {
    this.blip(220, 1.6, 'sine', 0.2, 55);
    this.noiseHit(1.2, 120, 0.3);
  }
  thump() { this.blip(58, 0.22, 'sine', 0.3, 40); }
}
