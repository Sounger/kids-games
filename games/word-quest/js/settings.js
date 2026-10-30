// The teacher's settings: word sets and options, saved in this browser (localStorage)
// and copied into CONFIG so every part of the game uses them. Export/import as a JSON file.

import { CONFIG } from './config.js';

const KEY = 'wq-settings';
const clone = o => JSON.parse(JSON.stringify(o));
const newId = () => Math.random().toString(36).slice(2, 9);

export const WORD_RE = /^[A-Za-z]{2,10}$/;

export function defaultSettings() {
  const sets = CONFIG.wordSets.map(s => ({ id: newId(), name: s.name, words: clone(s.words) }));
  return {
    version: 1,
    sets,
    activeSet: sets[0].id,
    play: clone(CONFIG.play),
    math: clone(CONFIG.math),
    chests: clone(CONFIG.chests),
    decoys: clone(CONFIG.decoys),
    mobs: clone(CONFIG.mobs),
    cave: clone(CONFIG.cave),
    voice: { rate: CONFIG.voice.rate, volume: CONFIG.voice.volume },
    audio: { music: CONFIG.audio.music },
    controls: { dpad: CONFIG.controls.dpad, swapAB: CONFIG.controls.swapAB },
  };
}

// Takes saved or imported data and keeps only what makes sense; anything missing gets the default.
export function cleanSettings(raw) {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const pick = (v, ok, def) => (ok(v) ? v : def);
  const num = (v, lo, hi, def) => (typeof v === 'number' && v >= lo && v <= hi ? v : def);
  const sets = Array.isArray(raw.sets) ? raw.sets.map(s => ({
    id: typeof s?.id === 'string' ? s.id : newId(),
    name: String(s?.name || 'Words').slice(0, 30),
    words: (Array.isArray(s?.words) ? s.words : [])
      .filter(w => WORD_RE.test(w?.word || ''))
      .map(w => ({ word: w.word.toUpperCase(), pic: typeof w.pic === 'string' ? w.pic : '' })),
  })) : [];
  const out = {
    version: 1,
    sets: sets.length ? sets : d.sets,
    play: {
      order: pick(raw.play?.order, v => ['order', 'random', 'manual'].includes(v), d.play.order),
      replay: pick(raw.play?.replay, v => ['next', 'same'].includes(v), d.play.replay),
    },
    math: {
      max: pick(raw.math?.max, v => [10, 20, 30].includes(v), d.math.max),
      ops: pick(raw.math?.ops, v => ['+', '-', 'both'].includes(v), d.math.ops),
    },
    chests: { share: num(raw.chests?.share, 0, 1, d.chests.share) },
    decoys: { enabled: pick(raw.decoys?.enabled, v => typeof v === 'boolean', d.decoys.enabled), count: num(raw.decoys?.count, 0, 8, d.decoys.count) },
    mobs: { enabled: pick(raw.mobs?.enabled, v => typeof v === 'boolean', d.mobs.enabled) },
    cave: { enabled: pick(raw.cave?.enabled, v => typeof v === 'boolean', d.cave.enabled) },
    voice: { rate: num(raw.voice?.rate, 0.5, 1.5, d.voice.rate), volume: num(raw.voice?.volume, 0, 1, d.voice.volume) },
    audio: { music: num(raw.audio?.music, 0, 1, d.audio.music) },
    controls: {
      dpad: pick(raw.controls?.dpad, v => ['iso', 'screen'].includes(v), d.controls.dpad),
      swapAB: pick(raw.controls?.swapAB, v => typeof v === 'boolean', d.controls.swapAB),
    },
  };
  out.activeSet = out.sets.some(s => s.id === raw.activeSet) ? raw.activeSet : out.sets[0].id;
  return out;
}

export function loadSettings() {
  try { return cleanSettings(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return defaultSettings(); }
}

// Returns false if the browser refused (for example, too many big pictures).
export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}

// Copies the settings into CONFIG (in place, so modules holding parts of CONFIG see the change).
export function applySettings(s) {
  Object.assign(CONFIG.play, s.play);
  Object.assign(CONFIG.math, s.math);
  Object.assign(CONFIG.chests, s.chests);
  Object.assign(CONFIG.decoys, s.decoys);
  Object.assign(CONFIG.mobs, s.mobs);
  Object.assign(CONFIG.cave, s.cave);
  Object.assign(CONFIG.voice, s.voice);
  CONFIG.audio.music = s.audio.music;
  Object.assign(CONFIG.controls, s.controls);
  // Quick overrides for testing: ?move=screen, ?swapab=1
  const params = new URLSearchParams(location.search);
  if (params.get('move') === 'screen') CONFIG.controls.dpad = 'screen';
  if (params.get('swapab') === '1') CONFIG.controls.swapAB = true;
}

export function activeWords(s) {
  const set = s.sets.find(x => x.id === s.activeSet) || s.sets[0];
  return set.words.length ? set.words : CONFIG.wordSets[0].words;
}

export { newId };
