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
    win() {
      arp([523, 659, 784, 1047, 784, 1047, 1319], 0.11, { vol: 0.13 });
      arp([262, 330, 392, 523], 0.22, { type: 'triangle', vol: 0.18 });
      for (let k = 0; k < 4; k++) noise(0.4, { vol: 0.15, freq: 600 + k * 300, when: 0.9 + k * 0.25, q: 0.5 });
    },
  };

  return {
    ensure,
    sfx,
    get unlocked() { return !!ctx && ctx.state === 'running'; },
    get sfxOn() { return sfxOn; },
    setSfx(on) {
      sfxOn = on;
      try { localStorage.setItem('wq-sfx', on ? 'on' : 'off'); } catch (e) {}
      if (sfxBus) sfxBus.gain.value = on ? cfg.sfx : 0;
    },
  };
}
