// Chiptune sound effects, synthesised with the Web Audio API (no sound files).
// Browsers only allow sound after the first click or key press on the page — a gamepad
// button does not count — so the context is (re)started on the first such action.

export function createAudio(cfg) {
  let ctx = null, master = null, sfxBus = null, noiseBuf = null;
  let sfxOn = true;
  try { sfxOn = localStorage.getItem('wq-sfx') !== 'off'; } catch (e) {}

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = cfg.master;
        master.connect(ctx.destination);
        sfxBus = ctx.createGain();
        sfxBus.gain.value = sfxOn ? cfg.sfx : 0;
        sfxBus.connect(master);
        // One second of white noise for claps, steps and fireworks.
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, ensure, { capture: true });

  // A blip: square/triangle wave, optional pitch slide to `to`.
  function tone(freq, dur, { type = 'square', vol = 0.15, when = 0, to = null } = {}) {
    if (!ensure() || !sfxOn) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.2, when = 0, freq = 3000, q = 1 } = {}) {
    if (!ensure() || !sfxOn) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  const arp = (notes, step, opts) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opts, when: (opts?.when || 0) + i * step }));

  const sfx = {
    step: () => noise(0.05, { vol: 0.06, freq: 900 + Math.random() * 300, q: 2 }),
    pickup: () => arp([523, 659, 784, 1047], 0.06, { vol: 0.12 }),
    land: () => { tone(1568, 0.12, { type: 'triangle', vol: 0.2 }); tone(2093, 0.25, { type: 'triangle', vol: 0.15, when: 0.07 }); },
    hop: () => tone(300, 0.18, { vol: 0.08, to: 700 }),
    clap: () => { noise(0.08, { vol: 0.35, freq: 1800, q: 0.8 }); noise(0.06, { vol: 0.25, freq: 2400, q: 0.8, when: 0.03 }); },
    click: () => tone(880, 0.06, { vol: 0.1 }),
    whoosh: () => noise(0.35, { vol: 0.08, freq: 1200, q: 0.6 }),
    jump: () => { tone(220, 0.35, { vol: 0.1, to: 880 }); tone(330, 0.3, { type: 'triangle', vol: 0.08, to: 990, when: 0.05 }); },
    bloop: () => { tone(500, 0.25, { type: 'sine', vol: 0.2, to: 120 }); tone(380, 0.12, { type: 'square', vol: 0.06, to: 200 }); },
    poof: () => noise(0.3, { vol: 0.18, freq: 700, q: 0.5 }),
    giggle: () => [1400, 1100, 1500, 1150, 1600, 1200].forEach((f, i) => tone(f, 0.07, { type: 'square', vol: 0.06, when: i * 0.07 })),
    boing: () => tone(160, 0.3, { type: 'triangle', vol: 0.25, to: 520 }),
    squeak: () => { tone(1200, 0.12, { vol: 0.07, to: 1800 }); tone(1600, 0.12, { vol: 0.06, to: 2200, when: 0.12 }); },
    buzz() {
      if (!ensure() || !sfxOn) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 180;
      lfo.frequency.value = 30; lg.gain.value = 25;
      lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      o.connect(g).connect(sfxBus);
      o.start(t); lfo.start(t); o.stop(t + 0.85); lfo.stop(t + 0.85);
    },
    hoot: () => { tone(420, 0.25, { type: 'sine', vol: 0.18, to: 380 }); tone(400, 0.35, { type: 'sine', vol: 0.18, to: 340, when: 0.32 }); },
    bloom: () => arp([1047, 1319, 1568], 0.05, { type: 'sine', vol: 0.06, when: 0.5 }),
    select: () => tone(660, 0.05, { vol: 0.08 }),
    shake: () => { for (let k = 0; k < 4; k++) noise(0.07, { vol: 0.25, freq: 250, q: 1.5, when: k * 0.08 }); tone(110, 0.3, { type: 'triangle', vol: 0.15 }); },
    chestOpen() {
      noise(0.15, { vol: 0.15, freq: 500, q: 1 });
      arp([784, 988, 1175, 1568, 1976], 0.07, { type: 'triangle', vol: 0.16, when: 0.1 });
      for (let k = 0; k < 6; k++) tone(2500 + Math.random() * 2000, 0.08, { type: 'sine', vol: 0.05, when: 0.3 + k * 0.06 });
    },
    win() {
      arp([523, 659, 784, 1047, 784, 1047, 1319], 0.11, { vol: 0.13 });
      arp([262, 330, 392, 523], 0.22, { type: 'triangle', vol: 0.18 });
      for (let k = 0; k < 4; k++) noise(0.4, { vol: 0.15, freq: 600 + k * 300, when: 0.9 + k * 0.25, q: 0.5 });
    },
  };

  // Soft background sounds: wind always; birds by day, rain, or crickets in the evening.
  let ambientNodes = [], ambientTimer = null;
  function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    ambientNodes = [];
    clearInterval(ambientTimer);
  }
  function startAmbient(weather) {
    stopAmbient();
    if (!ensure()) return;
    const loopNoise = (type, freq, vol) => {
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; src.loop = true;
      f.type = type; f.frequency.value = freq;
      g.gain.value = vol;
      src.connect(f).connect(g).connect(sfxBus);
      src.start();
      ambientNodes.push(src);
      return g;
    };
    const wind = loopNoise('lowpass', 380, 0.05);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 0.12; depth.gain.value = 0.035;
    lfo.connect(depth).connect(wind.gain);
    lfo.start();
    ambientNodes.push(lfo);
    if (weather === 'rain') loopNoise('highpass', 2500, 0.05);
    ambientTimer = setInterval(() => {
      if (Math.random() < 0.5) return;
      if (weather === 'clear') {
        const f = 2200 + Math.random() * 1500;
        tone(f, 0.08, { type: 'sine', vol: 0.04, to: f * 1.4 });
        tone(f * 1.1, 0.1, { type: 'sine', vol: 0.035, to: f * 1.5, when: 0.12 });
      } else if (weather === 'evening') {
        for (let k = 0; k < 3; k++) tone(4400, 0.03, { type: 'square', vol: 0.012, when: k * 0.06 });
      }
    }, 2500);
  }

  return {
    ensure,
    sfx,
    startAmbient,
    stopAmbient,
    get unlocked() { return !!ctx && ctx.state === 'running'; },
    get sfxOn() { return sfxOn; },
    setSfx(on) {
      sfxOn = on;
      try { localStorage.setItem('wq-sfx', on ? 'on' : 'off'); } catch (e) {}
      if (sfxBus) sfxBus.gain.value = on ? cfg.sfx : 0;
    },
  };
}
