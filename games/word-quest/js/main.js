// Word Quest — stage 1: the overworld, the hero, controls and camera.

import { CONFIG } from './config.js';
import { buildSprites } from './sprites.js';
import { generateMap } from './map.js';
import { createInput } from './input.js';
import { Hero, dpadToWorld } from './hero.js';
import { createRenderer } from './render.js';

const $ = id => document.getElementById(id);
const canvas = $('game');

const sprites = buildSprites();
const renderer = createRenderer(canvas, sprites, CONFIG.view);
const input = createInput(canvas, CONFIG.controls);

let map, hero;
let state = 'title'; // title → play ⇄ paused

function newWorld() {
  map = generateMap(Math.floor(Math.random() * 1e9), CONFIG.map);
  hero = new Hero(map.start.x, map.start.y, CONFIG.hero);
  renderer.follow(hero, 0, true);
}

function setState(s) {
  state = s;
  $('title').classList.toggle('hidden', s !== 'title');
  $('pause').classList.toggle('hidden', s !== 'paused');
  document.body.classList.toggle('playing', s === 'play');
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

$('playBtn').onclick = () => setState('play');
$('resumeBtn').onclick = () => setState('play');
$('fsBtn').onclick = toggleFullscreen;

function updatePadChip() {
  const on = input.pad.connected;
  for (const el of document.querySelectorAll('.pad-chip')) {
    el.classList.toggle('on', on);
    el.querySelector('.txt').textContent = on ? 'Gamepad ready' : 'Gamepad: press any button';
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  input.update();
  updatePadChip();

  if (input.pressed('fullscreen')) toggleFullscreen();

  if (state === 'title') {
    if (input.pressed('A')) setState('play');
  } else if (state === 'paused') {
    if (input.pressed('pause') || input.pressed('A')) setState('play');
  } else if (state === 'play') {
    if (input.pressed('pause')) setState('paused');
    if (input.pressed('A')) hero.hop();
    if (input.pressed('B')) hero.doClap();
    for (const c of input.clicks) {
      const w = renderer.screenToWorld(c.x, c.y);
      const goal = map.nearestWalkable(Math.floor(w.x), Math.floor(w.y));
      const from = { i: Math.floor(hero.x), j: Math.floor(hero.y) };
      const path = goal && map.pathTo(from, goal);
      if (path) hero.walkPath(path, goal);
    }
    hero.update(dt, dpadToWorld(input.dirs, CONFIG.controls.dpad), map);
  }

  renderer.follow(hero, dt);
  renderer.draw(map, hero, now / 1000);
  requestAnimationFrame(frame);
}

newWorld();
setState('title');
requestAnimationFrame(frame);

// For quick checks from the browser console.
window.wq = { get map() { return map; }, get hero() { return hero; }, get state() { return state; }, input, renderer, newWorld, CONFIG };
