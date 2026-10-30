// Word Quest — stage 6: letters on the map and in chests, decoys, voice, sounds, teacher menu.

import { CONFIG } from './config.js';
import { buildSprites } from './sprites.js';
import { generateMap } from './map.js';
import { createInput } from './input.js';
import { Hero, dpadToWorld } from './hero.js';
import { createRenderer } from './render.js';
import { createWord } from './word.js';
import { setupWordUI, flyLetter, confetti, highlightLetter, mathBox, showBubble, placeBubble, hideBubble, picker } from './ui.js';
import { letterName } from './voice.js';
import { loadSettings, saveSettings, applySettings, activeWords } from './settings.js';
import { setupGear, createTeacherMenu } from './teacher.js';
import { makeProblem } from './math.js';
import { createVoice } from './voice.js';
import { createAudio } from './audio.js';

const $ = id => document.getElementById(id);
const canvas = $('game');

const sprites = buildSprites();
const renderer = createRenderer(canvas, sprites, CONFIG.view);
const input = createInput(canvas, CONFIG.controls);
const voice = createVoice(CONFIG.voice);
const audio = createAudio(CONFIG.audio);
const sfx = audio.sfx;

let settings = loadSettings();
applySettings(settings);
const words = () => activeWords(settings);

let map, hero, word;
let wordIndex = 0;
let arrived = 0;          // letters that have landed in their slots
let celebrateT = 0;
let stepT = 0;
let state = 'title';      // title → show → play ⇄ paused / chest → celebrate → win → show …
let chestTarget = null;   // chest the hero walks to after a click
let quiz = null;          // the open chest window: { chest, problem, sel, busy }
let bubbleT = -1;         // thought bubble over the hero, seconds left

function startWord(index) {
  const list = words();
  wordIndex = ((index % list.length) + list.length) % list.length;
  map = generateMap(Math.floor(Math.random() * 1e9), CONFIG.map);
  hero = new Hero(map.start.x, map.start.y, CONFIG.hero);
  word = createWord(list[wordIndex], map, CONFIG.letters, CONFIG.chests, CONFIG.decoys);
  bubbleT = -1;
  hideBubble();
  chestTarget = null;
  quiz = null;
  mathBox.close();
  arrived = 0;
  setupWordUI(word);
  renderer.follow(hero, 0, true);
  setState('show');
  sayWord();
}

// "Apple. A-P-P-L-E. Apple!" — the big word lights up letter by letter.
const sayWord = () => voice.spell(word.word, highlightLetter);

function setState(s) {
  state = s;
  for (const id of ['title', 'show', 'pause', 'win', 'pick']) $(id).classList.toggle('hidden', id !== (s === 'paused' ? 'pause' : s));
  document.body.dataset.state = s;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

const button = (id, fn) => { $(id).onclick = () => { sfx.click(); fn(); }; };
// Which word comes next, as the teacher set it: in order, random, or chosen on a screen.
let started = false;
function nextGame(kind) {
  const n = words().length;
  if (kind === 'same') return startWord(wordIndex);
  if (settings.play.order === 'manual') return openPicker();
  if (settings.play.order === 'random') {
    let i = Math.floor(Math.random() * n);
    if (n > 1 && started) while (i === wordIndex) i = Math.floor(Math.random() * n);
    started = true;
    return startWord(i);
  }
  const first = !started;
  started = true;
  startWord(first ? wordIndex : wordIndex + 1);
}
const afterWin = () => nextGame(settings.play.replay === 'same' ? 'same' : 'next');

let pickSel = 0;
function openPicker() {
  picker.open(words(), i => { sfx.click(); started = true; startWord(i); });
  pickSel = Math.min(pickSel, words().length - 1);
  setState('pick');
  picker.select(pickSel);
}
function pickInput() {
  const n = words().length, cols = picker.columns();
  const moveTo = i => { pickSel = Math.max(0, Math.min(n - 1, i)); picker.select(pickSel); sfx.select(); };
  if (input.pressed('left')) moveTo(pickSel - 1);
  if (input.pressed('right')) moveTo(pickSel + 1);
  if (input.pressed('up')) moveTo(pickSel - cols);
  if (input.pressed('down')) moveTo(pickSel + cols);
  if (input.pressed('A')) { sfx.click(); started = true; startWord(pickSel); }
}

button('playBtn', () => nextGame('first'));
button('goBtn', () => setState('play'));
button('resumeBtn', () => setState('play'));
button('nextBtn', afterWin);
button('sameBtn', () => nextGame('same'));

// ── Teacher menu ──
let beforeTeacher = 'title';
const teacher = createTeacherMenu({
  getSettings: () => settings,
  onChange(s) {
    settings = s;
    if (!saveSettings(settings)) alert('Could not save. There may be too many big pictures — try smaller ones.');
    applySettings(settings);
  },
  onNewWord() { teacher.close(); started = true; nextGame('next'); },
  onClose() { teacher.close(); setState(beforeTeacher); },
  sayTest: () => voice.speak(['Hello! Apple. A, P, P, L, E.']),
});
setupGear($('gearBtn'), () => {
  if (state === 'teacher') return;
  beforeTeacher = state;
  if (state === 'play') beforeTeacher = 'paused';
  setState('teacher');
  teacher.open();
});
button('fsBtn', toggleFullscreen);
$('sayBtn').onclick = sayWord;
$('showSayBtn').onclick = sayWord;
$('sfxBtn').onclick = () => { audio.setSfx(!audio.sfxOn); updateSfxBtn(); sfx.click(); };
const updateSfxBtn = () => { $('sfxBtn').textContent = audio.sfxOn ? '🔔' : '🔕'; };
updateSfxBtn();

function updatePadChip() {
  const on = input.pad.connected;
  for (const el of document.querySelectorAll('.pad-chip')) {
    el.classList.toggle('on', on);
    el.querySelector('.txt').textContent = on ? 'Gamepad ready' : 'Gamepad: press any button';
  }
  // Sound needs one click or key press on the page first (a gamepad button does not count).
  const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : audio.unlocked;
  $('soundHint').classList.toggle('hidden', active);
}

// "Oops! We don't need Z. We need P, L, or E!" — no penalty, the letter just bounces off.
function rejectDecoy(item) {
  item.picked = true;
  item.rejectT = 0;
  const away = Math.sign(toScreenX(item) - toScreenX(hero)) || 1;
  item.awayX = away; item.awayY = 0.5;
  sfx.bloop();
  setTimeout(() => sfx.poof(), 700);
  const need = word.missing;
  const names = need.map(letterName);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}` : names[0];
  voice.speak([`Oops! We don't need ${letterName(item.ch)}.`, `We need ${list}!`]);
  showBubble(item.ch, need, word.word);
  bubbleT = 4;
}
const toScreenX = p => p.x - p.y;

function pickUp(item, { say = true } = {}) {
  if (item.decoy) return rejectDecoy(item);
  const slot = word.take(item);
  hero.hop();
  sfx.pickup();
  if (say) voice.letter(item.ch);
  flyLetter(item.ch, item.color, renderer.worldToClient(item.x, item.y, 24), slot, () => {
    sfx.land();
    arrived++;
    if (arrived === word.slots.length) {
      celebrateT = 0;
      confetti();
      sfx.win();
      voice.speak(['Great job!', `${word.word.toLowerCase()}!`]);
      setState('celebrate');
    }
  });
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const CHEST_REACH = 1.6;

// ── Chests ──
function openChest(chest) {
  hero.stopPath();
  chestTarget = null;
  const problem = makeProblem(CONFIG.math);
  quiz = { chest, problem, sel: problem.options[1], busy: false };
  mathBox.open(problem, answer);
  mathBox.select(quiz.sel);
  setState('chest');
  sfx.click();
  voice.speak([problem.speech]);
}

function moveSelection(step) {
  const values = mathBox.buttons().map(b => +b.dataset.value);
  const k = values.indexOf(quiz.sel);
  quiz.sel = values[Math.max(0, Math.min(values.length - 1, k + step))];
  mathBox.select(quiz.sel);
  sfx.select();
}

function answer(n) {
  if (!quiz || quiz.busy) return;
  const { chest, problem } = quiz;
  if (n === problem.answer) {
    quiz.busy = true;
    mathBox.right(n);
    sfx.chestOpen();
    voice.speak(['Correct!']);
    setTimeout(() => {
      mathBox.close();
      quiz = null;
      chest.open = true;
      setState('play');
      pickUp(chest.item);
    }, 900);
  } else {
    // Never stuck: the wrong answer disappears, so at worst one button is left.
    mathBox.wrong(n);
    chest.shakeT = 0;
    sfx.shake();
    voice.speak(['Try again!']);
    quiz.sel = +mathBox.buttons()[0].dataset.value;
    mathBox.select(quiz.sel);
  }
}

function closeChest() {
  if (!quiz || quiz.busy) return;
  quiz = null;
  mathBox.close();
  setState('play');
}

function quizInput() {
  if (input.pressed('left') || input.pressed('up')) moveSelection(-1);
  if (input.pressed('right') || input.pressed('down')) moveSelection(1);
  if (input.pressed('A')) answer(quiz.sel);
  else if (input.pressed('B') || input.pressed('pause')) closeChest();
}

// ── Jumping over a rock: A while walking towards it ──
function tryRockJump() {
  const d = hero.lastDir;
  const ri = Math.floor(hero.x + d.x * 0.8), rj = Math.floor(hero.y + d.y * 0.8);
  if (!map.isRock(ri, rj)) return false;
  const si = Math.round(d.x), sj = Math.round(d.y);
  const landings = [[ri + si, rj + sj], [ri + si, rj], [ri, rj + sj]].filter(([i, j]) => (i !== ri || j !== rj) && map.walkable(i, j));
  if (!landings.length) return false;
  const [li, lj] = landings[0];
  hero.jumpTo(li + 0.5, lj + 0.5);
  sfx.jump();
  return true;
}

function play(dt) {
  if (input.pressed('pause')) return setState('paused');
  if (input.pressed('A') && !hero.jump) {
    const near = word.left.filter(it => dist(it, hero) < CONFIG.letters.reachA).sort((a, b) => dist(a, hero) - dist(b, hero))[0];
    const chest = word.closedChests.filter(c => dist(c, hero) < CHEST_REACH).sort((a, b) => dist(a, hero) - dist(b, hero))[0];
    if (near) pickUp(near);
    else if (chest) return openChest(chest);
    else if (!tryRockJump() && hero.hop()) sfx.hop();
  }
  if (input.pressed('B')) { hero.doClap(); sfx.clap(); }

  for (const c of input.clicks) {
    const w = renderer.screenToWorld(c.x, c.y);
    const onIt = it => dist(it, w) < 0.9 || dist({ x: it.x - 0.5, y: it.y - 0.5 }, w) < 0.6;
    // A click on a chest: open it if the hero is next to it, else walk there first.
    const chest = word.closedChests.find(onIt);
    if (chest) {
      if (dist(chest, hero) < CHEST_REACH) return openChest(chest);
      const goal = map.nearestWalkable(chest.i, chest.j);
      const path = goal && map.pathTo({ i: Math.floor(hero.x), j: Math.floor(hero.y) }, goal);
      if (path) { hero.walkPath(path, goal); chestTarget = chest; }
      continue;
    }
    chestTarget = null;
    // A click on (or just above) a letter walks to that letter.
    const letter = word.left.find(onIt);
    const goal = letter ? { i: Math.floor(letter.x), j: Math.floor(letter.y) } : map.nearestWalkable(Math.floor(w.x), Math.floor(w.y));
    const path = goal && map.pathTo({ i: Math.floor(hero.x), j: Math.floor(hero.y) }, goal);
    if (path) hero.walkPath(path, goal);
  }

  const move = dpadToWorld(input.dirs, CONFIG.controls.dpad);
  if (move.x || move.y) chestTarget = null;
  hero.update(dt, move, map);
  if (chestTarget && !hero.path && dist(chestTarget, hero) < CHEST_REACH) return openChest(chestTarget);
  stepT = hero.walking ? stepT + dt : 0.2;
  if (stepT >= 0.25) { stepT = 0; sfx.step(); }

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
    if (input.pressed('A')) nextGame('first');
  } else if (state === 'pick') {
    pickInput();
  } else if (state === 'show') {
    if (input.pressed('A')) setState('play');
  } else if (state === 'teacher') {
    if (input.pressed('pause')) { teacher.close(); setState(beforeTeacher); }
  } else if (state === 'paused') {
    if (input.pressed('pause') || input.pressed('A')) setState('play');
  } else if (state === 'play') {
    play(dt);
  } else if (state === 'chest') {
    quizInput();
  } else if (state === 'celebrate') {
    celebrateT += dt;
    hero.update(dt, { x: 0, y: 0 }, map);
    hero.hop();
    if (celebrateT > 1.6) setState('win');
  } else if (state === 'win') {
    hero.update(dt, { x: 0, y: 0 }, map);
    if (input.pressed('A')) afterWin();
  }

  for (const it of word ? word.rejected : []) { it.rejectT += dt; if (it.rejectT > 1.2) it.rejectT = -2; }
  if (bubbleT >= 0) {
    bubbleT -= dt;
    if (bubbleT < 0 || state !== 'play') { bubbleT = -1; hideBubble(); }
    else placeBubble(renderer.worldToClient(hero.x, hero.y, 86 + hero.z));
  }
  for (const c of word ? word.chests : []) if (c.shakeT >= 0) { c.shakeT += dt; if (c.shakeT > 0.45) c.shakeT = -1; }
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
  input, renderer, startWord, CONFIG, voice, audio, get settings() { return settings; },
};
