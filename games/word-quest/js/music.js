// 8-bit music, synthesised like the NES / Dendy sound chip:
//   pulse 1 — melody (25% duty), pulse 2 — harmony arpeggio (12.5%), triangle — bass, noise — drums.
// A small sequencer schedules notes a little ahead of time; tracks fade into each other.
// Any track can be swapped for a recorded file later: set CONFIG.musicFiles.overworld = 'music/overworld.ogg'.

import { TRACKS, CHORDS } from './tracks.js';

const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = name => {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  return m ? 440 * Math.pow(2, (12 * (+m[2] + 1) + SEMI[m[1]] - 69) / 12) : 0;
};

const DRUMS = {
  pop: 'K . H . S . H . K . H K S . H .',
  soft: 'K . . . . . . . . . . . . . h .',
  roll: 'K . S S K . S S K S S S K S S S',
  none: '. . . . . . . . . . . . . . . .',
};

// Turns a track into a list of steps: each step holds the notes that start there.
function compile(track) {
  const steps = [];
  const add = (step, ev) => { (steps[step] ||= []).push(ev); };
  const total = track.melody.length * 16;
  const lay = (tokens, ch) => {
    for (let s = 0; s < tokens.length; s++) {
      const t = tokens[s];
      if (t === '-' || t === '.') continue;
      let len = 1;
      while (s + len < tokens.length && tokens[s + len] === '-') len++;
      add(s, { ch, f: freq(t), len });
    }
  };
  const melody = track.melody.flatMap(bar => {
    const tok = bar.trim().split(/\s+/);
    if (tok.length !== 16) console.warn('Bar is not 16 steps:', bar);
    return tok;
  });
  lay(melody, 'p1');
  const bass = [], arp = [];
  track.chords.forEach(name => {
    const [r, t, f] = CHORDS[name];
    bass.push(...`${r}3 - ${r}4 - ${f}3 - ${r}4 - ${r}3 - ${r}4 - ${f}3 - ${t}3 -`.split(' '));
    arp.push(...[r, t, f, t, r, t, f, t, r, t, f, t, r, t, f, t].map(n => `${n}4`));
  });
  lay(bass.slice(0, total), 'tri');
  lay(arp.slice(0, total), 'p2');
  const drum = DRUMS[track.drums].split(' ');
  for (let s = 0; s < total; s++) if (drum[s % 16] !== '.') add(s, { ch: 'noise', kind: drum[s % 16] });
  return { steps, total, stepDur: 60 / track.bpm / 4 };
}

export function createMusic(audio, cfg, files = {}) {
  let bus = null, waves = null, on = true;
  let current = null;            // { name, gain, timer, … }
  let duck = 1, volume = cfg.music;
  const compiled = {};
  const buffers = {};
  try { on = localStorage.getItem('wq-music') !== 'off'; } catch (e) {}

  function setup() {
    const ctx = audio.ensure();
    if (!ctx) return null;
    if (!bus) {
      bus = ctx.createGain();
      bus.gain.value = on ? volume : 0;
      bus.connect(audio.master);
      // Pulse waves with NES duty cycles.
      const pulse = duty => {
        const n = 64, re = new Float32Array(n), im = new Float32Array(n);
        for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty);
        return ctx.createPeriodicWave(re, im);
      };
      waves = { p1: pulse(0.25), p2: pulse(0.125), p3: pulse(0.5) };
    }
    return ctx;
  }

  // One note on one channel.
  function note(ctx, out, ev, t, dur) {
    if (ev.ch === 'noise') {
      if (ev.kind === 'K') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.15);
        return;
      }
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = audio.noise;
      f.type = 'highpass'; f.frequency.value = ev.kind === 'S' ? 1500 : 7000;
      const len = ev.kind === 'S' ? 0.12 : 0.035, vol = ev.kind === 'S' ? 0.22 : ev.kind === 'h' ? 0.04 : 0.07;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      src.connect(f).connect(g).connect(out); src.start(t, Math.random() * 0.5); src.stop(t + len + 0.01);
      return;
    }
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (ev.ch === 'tri') o.type = 'triangle'; else o.setPeriodicWave(waves[ev.ch]);
    o.frequency.value = ev.f;
    const vol = ev.ch === 'p1' ? 0.13 : ev.ch === 'p2' ? 0.045 : 0.22;
    const end = t + Math.max(0.06, dur - 0.02);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol * 0.75, t + Math.min(0.08, dur * 0.5));
    g.gain.linearRampToValueAtTime(0, end);
    o.connect(g).connect(out);
    o.start(t); o.stop(end + 0.02);
  }

  function fadeOut(track, secs) {
    if (!track) return;
    const ctx = audio.ensure();
    track.stopped = true;
    clearInterval(track.timer);
    track.gain.gain.cancelScheduledValues(ctx.currentTime);
    track.gain.gain.setValueAtTime(track.gain.gain.value, ctx.currentTime);
    track.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + secs);
    track.src?.stop(ctx.currentTime + secs + 0.05);
    setTimeout(() => track.gain.disconnect(), secs * 1000 + 300);
  }

  // Plays a recorded file instead of the synth (if one is set and loads).
  async function loadFile(name) {
    if (!files[name]) return null;
    if (buffers[name] !== undefined) return buffers[name];
    try {
      const data = await (await fetch(files[name])).arrayBuffer();
      buffers[name] = await audio.ensure().decodeAudioData(data);
    } catch (e) { buffers[name] = null; }
    return buffers[name];
  }

  // Starts the notes (or file) of a track into its own gain node; returns the track.
  function startTrack(name, { fade = 1, onEnd } = {}) {
    const ctx = setup();
    const def = TRACKS[name];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(def.vol, ctx.currentTime + Math.max(0.02, Math.min(fade, 0.6)));
    gain.connect(bus);
    let out = gain;
    if (def.echo) {
      const dry = ctx.createGain(), delay = ctx.createDelay(1), fb = ctx.createGain();
      delay.delayTime.value = 60 / def.bpm * 0.75; fb.gain.value = 0.38;
      dry.connect(gain); dry.connect(delay); delay.connect(fb).connect(delay); delay.connect(gain);
      out = dry;
    }
    const track = { name, gain, vol: def.vol, stopped: false };
    const finish = () => { if (!track.stopped) { track.stopped = true; setTimeout(() => gain.disconnect(), 1500); onEnd?.(); } };

    loadFile(name).then(buf => {
      if (track.stopped) return;
      if (buf) {
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = def.loop;
        src.connect(out); src.start();
        track.src = src;
        if (!def.loop) src.onended = finish;
        return;
      }
      const song = compiled[name] ||= compile(def);
      let step = 0, next = ctx.currentTime + 0.05;
      track.timer = setInterval(() => {
        // If the browser held the timer back (window hidden), skip what was missed
        // instead of playing all those notes at once.
        if (next < ctx.currentTime - 0.1) next = ctx.currentTime + 0.05;
        while (!track.stopped && next < ctx.currentTime + 0.2) {
          for (const ev of song.steps[step] || []) note(ctx, out, ev, next, ev.len * song.stepDur);
          next += song.stepDur;
          if (++step >= song.total) {
            if (def.loop) step = 0;
            else {
              clearInterval(track.timer);
              setTimeout(finish, Math.max(0, (next - ctx.currentTime) * 1000));
              return;
            }
          }
        }
      }, 25);
    });
    return track;
  }

  // Background music: the track playing fades out, the new one fades in.
  function play(name, fade = 1) {
    if (!setup() || (current && current.name === name && !current.stopped)) return;
    fadeOut(current, fade);
    current = startTrack(name, { fade });
  }

  // A short jingle on top; the background music steps back while it plays.
  function jingle(name, onEnd) {
    const ctx = setup();
    if (!ctx) return;
    const bg = current && !current.stopped ? current : null;
    if (bg) bg.gain.gain.setTargetAtTime(bg.vol * 0.2, ctx.currentTime, 0.05);
    startTrack(name, {
      fade: 0.02,
      onEnd: () => {
        if (bg && !bg.stopped) bg.gain.gain.setTargetAtTime(bg.vol, audio.ensure().currentTime, 0.3);
        onEnd?.();
      },
    });
  }

  function applyGain() {
    if (!bus) return;
    const ctx = audio.ensure();
    bus.gain.setTargetAtTime(on ? volume * duck : 0, ctx.currentTime, 0.15);
  }

  return {
    play,
    jingle,
    stop: (fade = 1) => { fadeOut(current, fade); current = null; },
    get playing() { return current && !current.stopped ? current.name : null; },
    // Quieter while the voice is talking — the voice always comes first.
    duck(talking) { const d = talking ? 0.35 : 1; if (d !== duck) { duck = d; applyGain(); } },
    setVolume(v) { if (v !== volume) { volume = v; applyGain(); } },
    get on() { return on; },
    setOn(v) { on = v; try { localStorage.setItem('wq-music', v ? 'on' : 'off'); } catch (e) {} applyGain(); },
  };
}
