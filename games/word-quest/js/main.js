// Word Quest — stage 10: letters, chests, decoys, voice, sounds, teacher menu, mobs, living map, owl, music, secret cave.

import { CONFIG } from './config.js';
import { buildSprites } from './sprites.js';
import { generateMap, GRASS } from './map.js';
import { createInput } from './input.js';
import { Hero, dpadToWorld } from './hero.js';
import { createRenderer } from './render.js';
import { createWord } from './word.js';
import { setupWordUI, flyLetter, confetti, highlightLetter, whoScreen, mathBox, showBubble, placeBubble, hideBubble, picker, flyFromSlot, showHintBubble } from './ui.js';
import { createLife } from './life.js';
import { describePlace } from './hints.js';
import { createMobs } from './mobs.js';
import { letterName } from './voice.js';
import { loadSettings, saveSettings, applySettings, activeWords } from './settings.js';
import { setupGear, createTeacherMenu, tell } from './teacher.js';
import { makeProblem } from './math.js';
import { createVoice } from './voice.js';
import { createAudio } from './audio.js';
import { createMusic } from './music.js';
import { createCave } from './cave.js';
import { createPlayers, AVATARS, NAME_RE } from './players.js';

const $ = id => document.getElementById(id);
const canvas = $('game');

const sprites = buildSprites();
const renderer = createRenderer(canvas, sprites, CONFIG.view);
const input = createInput(canvas, CONFIG.controls);
const voice = createVoice(CONFIG.voice);
const audio = createAudio(CONFIG.audio);
const sfx = audio.sfx;
const music = createMusic(audio, CONFIG.audio, CONFIG.musicFiles);

let settings = loadSettings();
applySettings(settings);
saveSettings(settings);   // keeps any new built-in word set that was just added
const words = () => activeWords(settings);
const players = createPlayers();

let map, hero, word;
let wordIndex = 0;
let arrived = 0;          // letters that have landed in their slots
let celebrateT = 0;
let stepT = 0;
let state = 'title';      // title → show → play ⇄ paused / chest → celebrate → win → show …
let walkTarget = null;    // something clicked: walk up to it, then act()
let quiz = null;          // the open chest window: { chest, problem, sel, busy }
let bubbleT = -1;         // bubble over the hero or the owl, seconds left
let bubbleOn = 'hero';
let life = null;          // butterflies, birds, clouds, weather, blooming flowers
let owl = null;           // the helper owl on its stump: { x, y, near, talkT }
let hint = null, hintT = 0; // the letter the owl's arrow points at
let mobs = null;          // raccoon, slimes and bee (if the teacher has them on)
let hatch = null;         // trapdoor to the secret cave: { x, y }
let cave = null;          // the cave, made the first time the hero goes down
let inCave = false;
let surface = null;       // the meadow map and where the hero went down, while in the cave
let bonus = 0;            // crystals found in the cave (shown on the victory screen)
let toldHole = false;     // the owl mentions the hole once

function startWord(index) {
  const list = words();
  wordIndex = ((index % list.length) + list.length) % list.length;
  map = generateMap(Math.floor(Math.random() * 1e9), CONFIG.map);
  hero = new Hero(map.start.x, map.start.y, CONFIG.hero);
  word = createWord(list[wordIndex], map, CONFIG.letters, CONFIG.chests, CONFIG.decoys);
  bubbleT = -1;
  hideBubble();
  life = createLife(map, CONFIG.weather.enabled);
  audio.startAmbient(life.weather);
  owl = placeOwl();
  hatch = CONFIG.cave.enabled ? placeHatch() : null;
  // Mobs last: they must not start on a tile the owl or the trapdoor took.
  mobs = CONFIG.mobs.enabled ? createMobs(map, word) : null;
  cave = null; inCave = false; surface = null; bonus = 0; toldHole = false;
  updateBonus();
  hint = null; hintT = 0;
  walkTarget = null;
  quiz = null;
  mathBox.close();
  arrived = 0;
  setupWordUI(word);
  renderer.follow(hero, 0, true);
  setState('show');
  sayWord();
}

// "Apple. A-P-P-L-E. Apple!" — the big word lights up letter by letter.
const sayWord = () => voice.spell(word.word, highlightLetter, players.current ? `${players.current.name}!` : '');

// For changes that come a moment later (a letter landing, a chest opening): if the teacher
// menu is open meanwhile, the game goes there when the menu closes instead of underneath it.
function setLaterState(s) {
  if (state === 'teacher') beforeTeacher = s;
  else setState(s);
}

function setState(s) {
  state = s;
  for (const id of ['title', 'show', 'pause', 'win', 'pick', 'who', 'newPlayer']) $(id).classList.toggle('hidden', id !== (s === 'paused' ? 'pause' : s));
  document.body.dataset.state = s;
  // Background music follows the screen (the teacher menu keeps whatever is playing).
  const here = inCave ? 'cave' : 'overworld';
  const track = { title: 'title', pick: 'title', show: here, play: here, paused: here, chest: here }[s];
  if (track) music.play(track);
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

// ── Players ──
// "Who is playing?": the players' cards, then Guest and "New player". then() runs once chosen.
let whoThen = null, whoSel = 0;
const whoCards = () => [
  ...players.list.map(p => ({ avatar: p.avatar, name: p.name, note: p.words ? `⭐ ${p.words}` : '', id: p.id })),
  { avatar: '👤', name: 'Guest', guest: true },
  { avatar: '➕', name: 'New', add: true },
];
function openWho(then) {
  whoThen = then;
  const cards = whoCards();
  whoScreen.open(cards, chooseWho);
  const cur = cards.findIndex(c => c.id && c.id === players.current?.id);
  whoSel = cur >= 0 ? cur : 0;
  setState('who');
  whoScreen.select(whoSel);
}
function chooseWho(i) {
  const c = whoCards()[i];
  sfx.click();
  if (c.add) return openNewPlayer();
  players.choose(c.guest ? null : c.id);
  updatePlayer();
  whoThen();
}
function whoInput() {
  const n = whoCards().length, cols = whoScreen.columns();
  const moveTo = i => { whoSel = Math.max(0, Math.min(n - 1, i)); whoScreen.select(whoSel); sfx.select(); };
  if (input.pressed('left')) moveTo(whoSel - 1);
  if (input.pressed('right')) moveTo(whoSel + 1);
  if (input.pressed('up')) moveTo(whoSel - cols);
  if (input.pressed('down')) moveTo(whoSel + cols);
  if (input.pressed('A')) chooseWho(whoSel);
}

let npAvatar = AVATARS[0];
function openNewPlayer() {
  $('npName').value = '';
  $('npError').textContent = '';
  npAvatar = AVATARS[players.list.length % AVATARS.length];
  $('npAvatars').innerHTML = '';
  for (const a of AVATARS) {
    const b = document.createElement('button');
    b.textContent = a;
    b.classList.toggle('on', a === npAvatar);
    b.onclick = () => { npAvatar = a; [...$('npAvatars').children].forEach(x => x.classList.toggle('on', x === b)); sfx.select(); };
    $('npAvatars').appendChild(b);
  }
  setState('newPlayer');
  $('npName').focus();
}
function saveNewPlayer() {
  const name = $('npName').value.trim();
  if (!NAME_RE.test(name)) { $('npError').textContent = 'Type a name (letters only)'; return; }
  sfx.click();
  players.add(name, npAvatar);
  updatePlayer();
  whoThen();
}
$('npSave').onclick = saveNewPlayer;
$('npCancel').onclick = () => openWho(whoThen);
$('npName').onkeydown = e => { if (e.key === 'Enter') saveNewPlayer(); if (e.key === 'Escape') openWho(whoThen); };

// The player's picture and name: top left while playing, and on the victory screen.
function updatePlayer() {
  const p = players.current;
  $('playerChip').classList.toggle('on', !!p);
  $('chipAvatar').textContent = p ? p.avatar : '';
  $('chipName').textContent = p ? p.name : '';
  $('winPlayer').classList.toggle('hidden', !p);
  $('winPlayer').textContent = p ? `${p.avatar} ${p.name} — ⭐ ${p.words}` : '';
}
updatePlayer();

button('playBtn', () => openWho(() => nextGame('first')));
button('otherPlayerBtn', () => openWho(afterWin));
button('goBtn', () => setState('play'));
button('resumeBtn', () => setState('play'));
button('nextBtn', afterWin);
button('sameBtn', () => nextGame('same'));

// ── Teacher menu ──
let beforeTeacher = 'title';
const teacher = createTeacherMenu({
  getSettings: () => settings,
  players,
  onPlayers: updatePlayer,
  onChange(s) {
    settings = s;
    if (!saveSettings(settings)) tell('Could not save. There may be too many big pictures — try smaller ones.');
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
$('musicBtn').onclick = () => { music.setOn(!music.on); updateMusicBtn(); sfx.click(); };
const updateMusicBtn = () => { $('musicBtn').style.opacity = music.on ? 1 : 0.45; $('musicBtn').title = music.on ? 'Music: on' : 'Music: off'; };
updateMusicBtn();
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
  voice.speak([`Oops! We don't need ${letterName(item.ch)}.`, ...(list ? [`We need ${list}!`] : [])]);
  showBubble(item.ch, need, word.word);
  bubbleT = 4;
  bubbleOn = 'hero';
  placeBubble(renderer.worldToClient(hero.x, hero.y, 86 + hero.z));
}

// ── The owl ──
const OWL_REACH = 1.9;
function placeOwl() {
  // Close to the start (letters are never this close), on grass, where it blocks no way through.
  for (const t of map.reachableTiles().filter(t => t.d >= 3 && t.d <= 4)) {
    if (map.ground[map.idx(t.i, t.j)] === GRASS && map.tryBlock(t.i, t.j, { type: 'owl' })) return { x: t.i + 0.5, y: t.j + 0.5, near: false, talkT: 0 };
  }
  return null;
}
// "The letter L is near the river!" — about the closest letter still needed; an arrow points the way.
function owlTalk() {
  owl.talkT = 2;
  sfx.hoot();
  const needed = word.items.filter(it => !it.picked && !it.decoy).sort((a, b) => dist(a, hero) - dist(b, hero));
  if (!needed.length) { voice.speak(['Hoo hoo! Great job!']); return; }
  const target = needed[0], place = describePlace(map, target, hero);
  const hole = hatch && !toldHole ? ['I see a secret hole!'] : [];
  toldHole = true;
  voice.speak(['Hoo hoo!', place.speech, ...hole]);
  showHintBubble(target.ch, word.word, place.emoji);
  bubbleT = 5; bubbleOn = 'owl';
  placeBubble(renderer.worldToClient(owl.x, owl.y, 50));
  hint = target; hintT = 8;
}
const toScreenX = p => p.x - p.y;

function pickUp(item) {
  if (item.decoy) return rejectDecoy(item);
  if (item.golden) return goldenLetter(item);
  const slot = word.take(item);
  hero.hop();
  sfx.pickup();
  if (!item.chest && !inCave) { life.bloom(item.x, item.y); sfx.bloom(); }
  if (hint === item) hintT = 0;
  voice.letter(item.ch);
  const w = word;
  flyLetter(item.ch, item.color, renderer.worldToClient(item.x, item.y, 24), slot, () => { if (w === word) landed(slot); });
}

// A letter has landed in its slot; the last one wins the game.
function landed(slot) {
  sfx.land();
  word.slots[slot].filled = true;
  arrived++;
  if (arrived === word.slots.length) {
    celebrateT = 0;
    confetti();
    sfx.win();
    music.stop(0.3);
    music.jingle('victory');
    const who = players.current;
    voice.speak([who ? `Great job, ${who.name}!` : 'Great job!', `${word.word.toLowerCase()}!`]);
    players.won(bonus);
    updatePlayer();
    setLaterState('celebrate');
  }
}

// ── The secret cave ──
const HATCH_REACH = 1.6;
function placeHatch() {
  const spots = map.reachableTiles().filter(t => t.d >= 8 && map.ground[map.idx(t.i, t.j)] === GRASS);
  for (let k = 0; k < 40 && spots.length; k++) {
    const t = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
    if (!map.tryBlock(t.i, t.j, { type: 'hatch' })) continue;
    map.objects.push({ type: 'hatch', x: t.i + 0.5, y: t.j + 0.5, depth: t.i + t.j });
    return { x: t.i + 0.5, y: t.j + 0.5 };
  }
  return null;
}

function enterCave() {
  if (!cave) cave = createCave(Math.floor(Math.random() * 1e9), word);
  surface = { map, x: hero.x, y: hero.y };
  map = cave.map;
  hero.stopPath(); hero.knock = null; hero.jump = null;
  hero.x = cave.start.x; hero.y = cave.start.y;
  inCave = true;
  bubbleT = -1; hideBubble(); hint = null;
  renderer.follow(hero, 0, true);
  audio.stopAmbient();
  sfx.jump();
  music.play('cave');
  updateBonus();
  if (!cave.visited) voice.speak(['Wow! A secret cave!']);
  cave.visited = true;
}

function exitCave() {
  map = surface.map;
  hero.stopPath();
  hero.x = surface.x; hero.y = surface.y;
  inCave = false;
  renderer.follow(hero, 0, true);
  audio.startAmbient(life.weather);
  sfx.jump();
  music.play('overworld');
  updateBonus();
}

// The golden letter puts itself in an empty slot; the same letter up on the meadow is no longer needed.
function goldenLetter(item) {
  item.picked = true;
  hero.hop();
  const missing = word.missing;
  const ch = missing.includes(item.ch) ? item.ch : missing[0];
  if (!ch) return addBonus(3);
  const others = word.items.filter(it => !it.picked && !it.decoy && it.ch === ch);
  const twin = others.find(it => !it.chest) || others[0];
  if (!twin) return addBonus(3);
  if (twin.chest) twin.chest.open = true;
  const slot = word.take(twin);
  sfx.chestOpen();
  music.jingle('chest');
  voice.speak(['A golden letter!', `${letterName(ch)}!`]);
  const w = word;
  flyLetter(ch, twin.color, renderer.worldToClient(item.x, item.y, 24), slot, () => { if (w === word) landed(slot); });
}

function addBonus(n) {
  bonus += n;
  sfx.pickup();
  if (n > 1) voice.speak([`${n} crystals!`]);
  updateBonus();
}

function updateBonus() {
  $('bonusChip').classList.toggle('hidden', !inCave && !bonus);
  $('bonusNum').textContent = bonus;
  $('winBonus').classList.toggle('hidden', !bonus);
  $('winBonusNum').textContent = bonus;
}

// What can be picked up, opened or talked to where the hero is now.
function scene() {
  if (inCave) {
    return {
      left: cave.golden && !cave.golden.picked ? [cave.golden] : [],
      chests: cave.chest ? [cave.chest] : [],
      closedChests: cave.chest && !cave.chest.open ? [cave.chest] : [],
      rejected: [],
      things: [{ obj: cave.ladder, reach: HATCH_REACH, act: exitCave }],
    };
  }
  return {
    left: word.left, chests: word.chests, closedChests: word.closedChests, rejected: word.rejected,
    things: [owl && { obj: owl, reach: OWL_REACH, act: owlTalk }, hatch && { obj: hatch, reach: HATCH_REACH, act: enterCave }].filter(Boolean),
  };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const CHEST_REACH = 1.6;

// ── Chests ──
function openChest(chest) {
  hero.stopPath();
  walkTarget = null;
  const problem = makeProblem(CONFIG.math);
  // Nothing is selected at first, so no button looks like the answer; the D-pad selects one.
  quiz = { chest, problem, sel: null, busy: false };
  mathBox.open(problem, answer);
  mathBox.select(quiz.sel);
  setState('chest');
  sfx.click();
  voice.speak([problem.speech]);
}

function moveSelection(step) {
  const values = mathBox.buttons().map(b => +b.dataset.value);
  const k = values.indexOf(quiz.sel);
  quiz.sel = k < 0 ? values[Math.floor((values.length - 1) / 2)] : values[Math.max(0, Math.min(values.length - 1, k + step))];
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
    music.jingle('chest');
    voice.speak(['Correct!']);
    const w = word, q = quiz;
    setTimeout(() => {
      if (w !== word || q !== quiz) return;   // a new word was started meanwhile
      mathBox.close();
      quiz = null;
      chest.open = true;
      setLaterState('play');
      if (chest.bonus) addBonus(chest.bonus);
      else pickUp(chest.item);
    }, 900);
  } else {
    // Never stuck: the wrong answer disappears, so at worst one button is left.
    mathBox.wrong(n);
    chest.shakeT = 0;
    sfx.shake();
    voice.speak(['Try again!']);
    quiz.sel = null;
    mathBox.select(null);
  }
}

function closeChest() {
  if (!quiz || quiz.busy) return;
  quiz = null;
  mathBox.close();
  setState('play');
}

function quizInput() {
  if (!quiz) return setState('play');
  if (input.pressed('left') || input.pressed('up')) moveSelection(-1);
  if (input.pressed('right') || input.pressed('down')) moveSelection(1);
  if (input.pressed('A')) { if (quiz.sel === null) moveSelection(0); else answer(quiz.sel); }
  else if (input.pressed('B') || input.pressed('pause')) closeChest();
}

// ── Mobs ──
const mobEvents = {
  // The raccoon knocks one collected letter out of its slot; it lands on the ground nearby.
  raccoon() {
    sfx.giggle();
    const filled = word.slots.map((s, i) => (s.filled ? i : -1)).filter(i => i >= 0);
    if (!filled.length) return;
    const slot = filled[Math.floor(Math.random() * filled.length)];
    const spots = [];
    for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) {
      const i = Math.floor(hero.x) + di, j = Math.floor(hero.y) + dj, d = Math.hypot(di, dj);
      if (d >= 1.5 && d <= 3 && map.walkable(i, j)) spots.push({ x: i + 0.5, y: j + 0.5 });
    }
    const spot = spots[Math.floor(Math.random() * spots.length)] || { x: hero.x, y: hero.y };
    const item = word.giveBack(slot, spot.x, spot.y);
    arrived--;
    voice.speak([`Oh no! The raccoon took ${letterName(item.ch)}!`]);
    flyFromSlot(item.ch, item.color, slot, renderer.worldToClient(spot.x, spot.y, 20), () => { item.picked = false; sfx.land(); });
  },
  slime(m) { hero.knockBack(hero.x - m.x, hero.y - m.y); sfx.boing(); },
  bee() { hero.slowDown(3); sfx.buzz(); },
};

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

// The chest, owl, trapdoor or ladder that A would use right now (gets a bouncing "A" over it).
function promptTarget() {
  const here = scene();
  const lift = { chest: 40, owl: 44, hatch: 18, ladder: 64 };
  const chest = here.closedChests.find(c => dist(c, hero) < CHEST_REACH);
  if (chest) return { x: chest.x, y: chest.y, lift: lift.chest };
  const thing = here.things.find(t => dist(t.obj, hero) < t.reach);
  if (!thing) return null;
  const kind = thing.obj === owl ? 'owl' : thing.obj === hatch ? 'hatch' : 'ladder';
  return { x: thing.obj.x, y: thing.obj.y, lift: lift[kind] };
}

// Walk up to something that was clicked; act() once close enough.
function goTo(obj, reach, act) {
  if (dist(obj, hero) < reach) { walkTarget = null; return act(); }
  const goal = map.nearestWalkable(Math.floor(obj.x), Math.floor(obj.y));
  const path = goal && map.pathTo({ i: Math.floor(hero.x), j: Math.floor(hero.y) }, goal);
  if (path) { hero.walkPath(path, goal); walkTarget = { obj, reach, act }; }
}

function play(dt) {
  const here = scene();
  const nearest = (list, r) => list.filter(it => dist(it, hero) < r).sort((a, b) => dist(a, hero) - dist(b, hero))[0];
  if (input.pressed('pause')) return setState('paused');
  if (input.pressed('A') && !hero.jump) {
    const letter = nearest(here.left, CONFIG.letters.reachA);
    const chest = nearest(here.closedChests, CHEST_REACH);
    const thing = here.things.find(t => dist(t.obj, hero) < t.reach);
    if (letter) pickUp(letter);
    else if (chest) return openChest(chest);
    else if (thing) return thing.act();
    else if (!tryRockJump() && hero.hop()) sfx.hop();
  }
  if (input.pressed('B')) {
    hero.doClap(); sfx.clap();
    if (!inCave && mobs?.clap(hero)) setTimeout(() => sfx.squeak(), 150);
  }

  for (const c of input.clicks) {
    const w = renderer.screenToWorld(c.x, c.y);
    const onIt = it => dist(it, w) < 0.9 || dist({ x: it.x - 0.5, y: it.y - 0.5 }, w) < 0.6;
    walkTarget = null;
    const thing = here.things.find(t => onIt(t.obj));
    if (thing) { goTo(thing.obj, thing.reach, thing.act); continue; }
    const chest = here.closedChests.find(onIt);
    if (chest) { goTo(chest, CHEST_REACH, () => openChest(chest)); continue; }
    // A click on (or just above) a letter walks to that letter.
    const letter = here.left.find(onIt);
    const goal = letter ? { i: Math.floor(letter.x), j: Math.floor(letter.y) } : map.nearestWalkable(Math.floor(w.x), Math.floor(w.y));
    const path = goal && map.pathTo({ i: Math.floor(hero.x), j: Math.floor(hero.y) }, goal);
    if (path) hero.walkPath(path, goal);
  }
  if (state !== 'play') return;

  const move = dpadToWorld(input.dirs, CONFIG.controls.dpad);
  if (move.x || move.y) walkTarget = null;
  hero.update(dt, move, map);
  if (walkTarget && !hero.path && dist(walkTarget.obj, hero) < walkTarget.reach) {
    const { act } = walkTarget;
    walkTarget = null;
    return act();
  }
  stepT = hero.walking ? stepT + dt : 0.2;
  if (stepT >= 0.25) { stepT = 0; sfx.step(); }

  if (inCave) {
    for (const c of cave.crystals) if (!c.got && dist(c, hero) < 0.6) { c.got = true; addBonus(1); }
  } else {
    mobs?.update(dt, hero, mobEvents);
    if (owl) {
      const d = dist(owl, hero);
      if (!owl.near && d < OWL_REACH) owlTalk();
      if (d < OWL_REACH) owl.near = true; else if (d > 3) owl.near = false;
    }
  }

  // Walking onto a letter picks it up by itself.
  for (const it of here.left) if (dist(it, hero) < CONFIG.letters.pickupRadius) pickUp(it);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  input.update();
  updatePadChip();
  if (input.pressed('fullscreen')) toggleFullscreen();

  if (state === 'title') {
    if (input.pressed('A')) openWho(() => nextGame('first'));
  } else if (state === 'who') {
    whoInput();
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
  if (inCave) cave.update(dt);
  if (bubbleT >= 0) {
    bubbleT -= dt;
    if (bubbleT < 0 || state !== 'play') { bubbleT = -1; hideBubble(); }
    else if (bubbleOn === 'owl' && owl) placeBubble(renderer.worldToClient(owl.x, owl.y, 50));
    else placeBubble(renderer.worldToClient(hero.x, hero.y, 86 + hero.z));
  }
  for (const c of word ? [...word.chests, ...(cave?.chest ? [cave.chest] : [])] : []) if (c.shakeT >= 0) { c.shakeT += dt; if (c.shakeT > 0.45) c.shakeT = -1; }
  renderer.follow(hero, dt);
  if (owl) owl.talkT = Math.max(0, owl.talkT - dt);
  hintT = Math.max(0, hintT - dt);
  if (hint && (hint.picked || hintT <= 0 || state !== 'play')) { hint = null; hintT = 0; }
  life?.update(dt, renderer.view);
  music.duck(window.speechSynthesis?.speaking);
  music.setVolume(CONFIG.audio.music);
  const prompt = state === 'play' && word ? promptTarget() : null;
  if (inCave) renderer.draw(map, hero, now / 1000, scene(), [], { cave, prompt });
  else renderer.draw(map, hero, now / 1000, word, mobs?.list, { life, owl, hint, prompt });
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
  players, get mobs() { return mobs; }, get cave() { return cave; }, get inCave() { return inCave; }, get hatch() { return hatch; }, enterCave, exitCave, get owl() { return owl; }, get life() { return life; }, music, input, renderer, startWord, CONFIG, voice, audio, get settings() { return settings; },
};
