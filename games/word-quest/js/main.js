// Word Quest — stage 2: one word per session, letters on the map, slots at the bottom, victory.

import { CONFIG } from './config.js';
import { buildSprites } from './sprites.js';
import { generateMap } from './map.js';
import { createInput } from './input.js';
import { Hero, dpadToWorld } from './hero.js';
import { createRenderer } from './render.js';
import { createWord } from './word.js';
import { setupWordUI, flyLetter, confetti } from './ui.js';

const $ = id => document.getElementById(id);
const canvas = $('game');

const sprites = buildSprites();
const renderer = createRenderer(canvas, sprites, CONFIG.view);
const input = createInput(canvas, CONFIG.controls);

let map, hero, word;
let wordIndex = 0;
let arrived = 0;          // letters that have landed in their slots
let celebrateT = 0;
let state = 'title';      // title → show → play ⇄ paused → celebrate → win → show …

function startWord(index) {
  wordIndex = (index + CONFIG.words.length) % CONFIG.words.length;
  map = generateMap(Math.floor(Math.random() * 1e9), CONFIG.map);
  hero = new Hero(map.start.x, map.start.y, CONFIG.hero);
  word = createWord(CONFIG.words[wordIndex], map, CONFIG.letters);
  arrived = 0;
  setupWordUI(word);
  renderer.follow(hero, 0, true);
  setState('show');
}

function setState(s) {
  state = s;
  for (const id of ['title', 'show', 'pause', 'win']) $(id).classList.toggle('hidden', id !== (s === 'paused' ? 'pause' : s));
  document.body.dataset.state = s;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

$('playBtn').onclick = () => startWord(wordIndex);
$('goBtn').onclick = () => setState('play');
$('resumeBtn').onclick = () => setState('play');
$('nextBtn').onclick = () => startWord(wordIndex + 1);
$('sameBtn').onclick = () => startWord(wordIndex);
$('fsBtn').onclick = toggleFullscreen;

function updatePadChip() {
  const on = input.pad.connected;
  for (const el of document.querySelectorAll('.pad-chip')) {
    el.classList.toggle('on', on);
    el.querySelector('.txt').textContent = on ? 'Gamepad ready' : 'Gamepad: press any button';
  }
}

function pickUp(item) {
  const slot = word.take(item);
  hero.hop();
  flyLetter(item.ch, item.color, renderer.worldToClient(item.x, item.y, 24), slot, () => {
    arrived++;
    if (arrived === word.slots.length) {
      celebrateT = 0;
      confetti();
      setState('celebrate');
    }
  });
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function play(dt) {
  if (input.pressed('pause')) return setState('paused');
  if (input.pressed('A')) {
    const near = word.left.filter(it => dist(it, hero) < CONFIG.letters.reachA).sort((a, b) => dist(a, hero) - dist(b, hero))[0];
    if (near) pickUp(near); else hero.hop();
  }
  if (input.pressed('B')) hero.doClap();

  for (const c of input.clicks) {
    const w = renderer.screenToWorld(c.x, c.y);
    // A click on (or just above) a letter walks to that letter.
    const letter = word.left.find(it => dist(it, w) < 0.9 || dist({ x: it.x - 0.5, y: it.y - 0.5 }, w) < 0.6);
    const goal = letter ? { i: Math.floor(letter.x), j: Math.floor(letter.y) } : map.nearestWalkable(Math.floor(w.x), Math.floor(w.y));
    const path = goal && map.pathTo({ i: Math.floor(hero.x), j: Math.floor(hero.y) }, goal);
    if (path) hero.walkPath(path, goal);
  }

  hero.update(dt, dpadToWorld(input.dirs, CONFIG.controls.dpad), map);

  // Walking onto a letter picks it up by itself.
  for (const it of word.left) if (dist(it, hero) < CONFIG.letters.pickupRadius) pickUp(it);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  input.update();
  updatePadChip();
  if (input.pressed('fullscreen')) toggleFullscreen();

  if (state === 'title') {
    if (input.pressed('A')) startWord(wordIndex);
  } else if (state === 'show') {
    if (input.pressed('A')) setState('play');
  } else if (state === 'paused') {
    if (input.pressed('pause') || input.pressed('A')) setState('play');
  } else if (state === 'play') {
    play(dt);
  } else if (state === 'celebrate') {
    celebrateT += dt;
    hero.update(dt, { x: 0, y: 0 }, map);
    hero.hop();
    if (celebrateT > 1.6) setState('win');
  } else if (state === 'win') {
    hero.update(dt, { x: 0, y: 0 }, map);
    if (input.pressed('A')) startWord(wordIndex + 1);
  }

  renderer.follow(hero, dt);
  renderer.draw(map, hero, now / 1000, word);
  requestAnimationFrame(frame);
}

// The first map shows behind the title screen.
map = generateMap(Math.floor(Math.random() * 1e9), CONFIG.map);
hero = new Hero(map.start.x, map.start.y, CONFIG.hero);
renderer.follow(hero, 0, true);
setState('title');
requestAnimationFrame(frame);

// For quick checks from the browser console.
window.wq = {
  get map() { return map; }, get hero() { return hero; }, get word() { return word; }, get state() { return state; },
  input, renderer, startWord, CONFIG,
};
