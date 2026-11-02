// Magic Doors — three doors in a castle hall: + sums, − sums, and both mixed.
// Behind each door: a room with N sums; every right answer lights a star on the path,
// and a treasure chest opens at the end. Mouse, touch, keyboard and gamepad all work.

const $ = id => document.getElementById(id);

// ── The three doors ──
const DOORS = [
  { key: 'plus', sign: '+', label: 'PLUS', ops: ['+'], c: '#ef4444', c2: '#fca5a5', wood: '#c2410c', woodDark: '#7c2d12', theme: 'plus', items: ['🍎', '🍐'] },
  { key: 'minus', sign: '−', label: 'MINUS', ops: ['-'], c: '#3b82f6', c2: '#93c5fd', wood: '#1d4ed8', woodDark: '#1e3a8a', theme: 'minus', items: ['🐟', '🐟'] },
  { key: 'mix', sign: '+−', label: 'MIX', ops: ['+', '-'], c: '#a855f7', c2: '#e9d5ff', wood: '#7e22ce', woodDark: '#4c1d95', theme: 'mix', items: ['⭐', '🌙'] },
];
const RANGES = [10, 20, 30, 50, 100];
const COUNTS = [5, 10, 15];

// ── Settings and best scores, kept in this browser ──
const settings = { max: 20, count: 10, help: true, voice: true };
let best = {};
try { Object.assign(settings, JSON.parse(localStorage.getItem('md-settings') || '{}')); } catch (e) {}
try { best = JSON.parse(localStorage.getItem('md-best') || '{}'); } catch (e) {}
const saveSettings = () => { try { localStorage.setItem('md-settings', JSON.stringify(settings)); } catch (e) {} };
const saveBest = () => { try { localStorage.setItem('md-best', JSON.stringify(best)); } catch (e) {} };
if (!RANGES.includes(settings.max)) settings.max = 20;
if (!COUNTS.includes(settings.count)) settings.count = 10;

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// ── Sound: small synth, no files ──
let actx = null, soundOn = true;
try { soundOn = localStorage.getItem('md-sound') !== 'off'; } catch (e) {}
function ac() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { return null; }
  return actx;
}
addEventListener('pointerdown', ac, { capture: true });
addEventListener('keydown', ac, { capture: true });
function tone(f, dur, { type = 'triangle', vol = 0.15, when = 0, to = null } = {}) {
  if (!soundOn || !ac()) return;
  const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const arp = (notes, step, opts = {}) => notes.forEach((f, i) => tone(f, step * 2, { ...opts, when: (opts.when || 0) + i * step }));
const sfx = {
  select: () => tone(660, 0.06, { type: 'square', vol: 0.05 }),
  click: () => tone(880, 0.07, { type: 'square', vol: 0.06 }),
  creak: () => { tone(140, 0.7, { type: 'sawtooth', vol: 0.05, to: 90 }); arp([523, 659, 784, 1047, 1319], 0.08, { vol: 0.1, when: 0.4 }); },
  right: () => { arp([784, 988, 1175], 0.07, { vol: 0.16 }); tone(1568, 0.4, { vol: 0.1, when: 0.21 }); },
  wrong: () => { tone(330, 0.2, { type: 'sine', vol: 0.18 }); tone(262, 0.3, { type: 'sine', vol: 0.18, when: 0.15 }); },
  star: () => arp([1319, 1568, 2093], 0.05, { type: 'sine', vol: 0.08, when: 0.5 }),
  fanfare: () => { arp([523, 659, 784, 1047, 784, 1047, 1319], 0.12, { vol: 0.14 }); arp([262, 330, 392, 523], 0.24, { vol: 0.12 }); },
};

// ── Voice ──
let voice = null;
function pickVoice() {
  const vs = (window.speechSynthesis?.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang));
  const score = v => (/^en[-_]US/i.test(v.lang) ? 4 : 0) + (/natural|online/i.test(v.name) ? 4 : 0) + (/aria|jenny|google us/i.test(v.name) ? 2 : 0);
  voice = vs.sort((a, b) => score(b) - score(a))[0] || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
function say(...parts) {
  if (!settings.voice || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  for (const text of parts) {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US'; u.rate = 0.85; u.pitch = 1.1;
    speechSynthesis.speak(u);
  }
}

// ── Effects ──
function burst(x, y, chars = ['⭐', '✨', '🌟'], n = 12) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'burst';
    s.textContent = chars[i % chars.length];
    const a = (i / n) * Math.PI * 2, r = 90 + Math.random() * 90;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px');
    $('fx').appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}
function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

// Floating sparkles in the hall.
setInterval(() => {
  if (document.body.dataset.screen !== 'hall') return;
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.textContent = Math.random() < 0.5 ? '✦' : '✧';
  s.style.left = Math.random() * 100 + 'vw';
  s.style.fontSize = 10 + Math.random() * 18 + 'px';
  s.style.animationDuration = 6 + Math.random() * 5 + 's';
  $('hallSparkles').appendChild(s);
  setTimeout(() => s.remove(), 11000);
}, 450);

// ═════════════ Hall ═════════════
let screen = 'hall';
let doorSel = null;            // door picked with keys / gamepad (none until a key is pressed)
let busy = false;              // a door is opening

function bestText(d) {
  const b = best[`${d.key}_${settings.max}`];
  return b ? '⭐'.repeat(Math.min(b, 5)) + (b > 5 ? ` ${b}` : '') : '';
}

function renderHall() {
  $('rangeBadge').textContent = `0 – ${settings.max}`;
  const box = $('doors');
  box.innerHTML = '';
  DOORS.forEach((d, i) => {
    const b = document.createElement('button');
    b.className = 'door' + (doorSel === i ? ' sel' : '');
    b.style.setProperty('--c', d.c); b.style.setProperty('--c2', d.c2);
    b.style.setProperty('--wood', d.wood); b.style.setProperty('--wood-dark', d.woodDark);
    b.innerHTML = `
      <div class="gem">${d.sign.length > 1 ? `<span class="two">${[...d.sign].map(ch => `<b>${ch}</b>`).join('')}</span>` : `<span>${d.sign}</span>`}</div>
      <div class="frame">
        <div class="inside"></div>
        <div class="leaf"><div class="window"></div><div class="band b1"></div><div class="band b2"></div><div class="knob"></div></div>
      </div>
      <div class="label">${d.label}</div>
      <div class="best">${bestText(d)}</div>`;
    b.onclick = () => openDoor(i);
    b.onmouseenter = () => { if (doorSel !== null) { doorSel = i; markDoor(); } };
    box.appendChild(b);
  });
}
const markDoor = () => [...$('doors').children].forEach((b, i) => b.classList.toggle('sel', i === doorSel));

function openDoor(i) {
  if (busy) return;
  busy = true;
  const d = DOORS[i], el = $('doors').children[i];
  el.classList.add('open');
  sfx.creak();
  say(d.label === 'MIX' ? 'Plus and minus!' : d.label.toLowerCase() + '!');
  setTimeout(() => {
    const flash = document.createElement('div');
    flash.className = 'zoom-flash';
    flash.style.setProperty('--c', d.c); flash.style.setProperty('--c2', d.c2);
    document.body.appendChild(flash);
    setTimeout(() => { startRoom(i); flash.style.transition = 'opacity .5s'; flash.style.opacity = 0; setTimeout(() => flash.remove(), 600); }, 800);
  }, 900);
}

function showHall() {
  screen = 'hall';
  busy = false;
  document.body.dataset.screen = 'hall';
  $('hall').classList.remove('hidden');
  $('room').classList.add('hidden');
  $('done').classList.add('hidden');
  renderHall();
}

// ═════════════ Room ═════════════
let room = null;   // { door, problems, at, sel, mistakes, stars, locked }

function makeProblem(op, max) {
  let a, b, ans;
  if (op === '+') { ans = rand(2, max); a = rand(1, ans - 1); b = ans - a; }
  else { a = rand(2, max); b = rand(1, a); ans = a - b; }
  const near = shuffle([-3, -2, -1, 1, 2, 3]).map(k => ans + k).filter(n => n >= 0 && n <= max);
  const wrong = near.slice(0, 2);
  for (let k = 4; wrong.length < 2; k++) [ans + k, ans - k].forEach(n => { if (wrong.length < 2 && n >= 0 && n <= max + 3) wrong.push(n); });
  return { a, b, op, ans, options: shuffle([ans, ...wrong]) };
}
function makeProblems(door) {
  const list = [], seen = new Set();
  for (let tries = 0; list.length < settings.count && tries < 500; tries++) {
    const p = makeProblem(door.ops[Math.floor(Math.random() * door.ops.length)], settings.max);
    const key = `${p.a}${p.op}${p.b}`;
    if (seen.has(key) && tries < 400) continue;
    seen.add(key);
    list.push(p);
  }
  return list;
}

// A friendly round monster in the door's colour.
function mascotSVG(c, c2) {
  return `<svg viewBox="0 0 200 210" aria-hidden="true">
    <ellipse cx="100" cy="200" rx="62" ry="9" fill="rgba(0,0,0,.2)"/>
    <ellipse cx="70" cy="188" rx="20" ry="12" fill="${c}"/><ellipse cx="130" cy="188" rx="20" ry="12" fill="${c}"/>
    <path d="M52 52 L44 12 L80 40 Z M148 52 L156 12 L120 40 Z" fill="${c}" stroke="#2b2140" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="100" cy="110" r="80" fill="${c}" stroke="#2b2140" stroke-width="6"/>
    <ellipse cx="100" cy="135" rx="48" ry="40" fill="${c2}"/>
    <ellipse cx="70" cy="92" rx="20" ry="24" fill="#fff" stroke="#2b2140" stroke-width="4"/>
    <ellipse cx="130" cy="92" rx="20" ry="24" fill="#fff" stroke="#2b2140" stroke-width="4"/>
    <circle cx="74" cy="96" r="10" fill="#2b2140"/><circle cx="134" cy="96" r="10" fill="#2b2140"/>
    <circle cx="78" cy="91" r="4" fill="#fff"/><circle cx="138" cy="91" r="4" fill="#fff"/>
    <rect class="lid" x="48" y="66" width="104" height="52" fill="${c}"/>
    <circle cx="52" cy="122" r="9" fill="#f9a8d4" opacity=".8"/><circle cx="148" cy="122" r="9" fill="#f9a8d4" opacity=".8"/>
    <path d="M78 128 Q100 150 122 128" fill="none" stroke="#2b2140" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

function decorate(theme) {
  const bg = $('roomBg');
  bg.dataset.theme = theme;
  bg.innerHTML = '';
  const add = (cls, style, text = '') => { const e = document.createElement('div'); e.className = 'deco ' + cls; Object.assign(e.style, style); e.textContent = text; bg.appendChild(e); };
  if (theme === 'plus') {
    add('sun', {});
    for (let k = 0; k < 4; k++) add('cloud', { top: 6 + k * 12 + 'vh', animationDuration: 40 + k * 12 + 's', animationDelay: -k * 15 + 's' });
    add('hill', { left: '-10vw' }); add('hill', { left: '45vw', background: '#16a34a' });
    for (let k = 0; k < 9; k++) add('flower', { left: 4 + k * 11 + 'vw', bottom: 2 + (k % 3) * 3 + 'vh', animationDelay: -k * 0.4 + 's' }, ['🌷', '🌼', '🌸'][k % 3]);
  } else if (theme === 'minus') {
    for (let k = 0; k < 14; k++) { const s = 16 + Math.random() * 30; add('bubble', { left: Math.random() * 100 + 'vw', bottom: '-60px', width: s + 'px', height: s + 'px', animationDuration: 6 + Math.random() * 8 + 's', animationDelay: -Math.random() * 10 + 's' }); }
    for (let k = 0; k < 3; k++) add('fish', { top: 20 + k * 22 + 'vh', animationDuration: 16 + k * 6 + 's', animationDelay: -k * 5 + 's' }, ['🐠', '🐡', '🐟'][k]);
    for (let k = 0; k < 10; k++) add('weed', { left: 3 + k * 10 + 'vw', height: 8 + (k % 4) * 5 + 'vh', animationDelay: -k * 0.3 + 's' });
  } else {
    add('moon', {});
    for (let k = 0; k < 40; k++) add('star-tw', { left: Math.random() * 100 + 'vw', top: Math.random() * 70 + 'vh', fontSize: 8 + Math.random() * 18 + 'px', animationDelay: -Math.random() * 2 + 's' }, '✦');
  }
}

function startRoom(i) {
  const door = DOORS[i];
  room = { door, i, problems: makeProblems(door), at: 0, sel: null, mistakes: 0, stars: [], locked: false };
  screen = 'room';
  document.body.dataset.screen = 'room';
  $('hall').classList.add('hidden');
  $('done').classList.add('hidden');
  $('room').classList.remove('hidden');
  $('room').style.setProperty('--c', door.c);
  decorate(door.theme);
  $('mascot').innerHTML = mascotSVG(door.c, door.c2);
  $('path').innerHTML = room.problems.map(() => '<div class="step"></div>').join('');
  showProblem();
}

function showProblem() {
  const p = room.problems[room.at];
  room.sel = null; room.mistakes = 0; room.locked = false;
  [...$('path').children].forEach((s, k) => s.classList.toggle('now', k === room.at));
  const opSign = p.op === '+' ? '+' : '−';
  $('sum').innerHTML = `<span>${p.a}</span><span class="op">${opSign}</span><span>${p.b}</span><span>=</span><span class="q" id="qBox">?</span>`;
  // Little pictures to count, for small numbers.
  const h = $('helpers');
  h.innerHTML = '';
  if (settings.help && p.a <= 10 && p.b <= 10) {
    const [x, y] = room.door.items;
    const grp = (n, ch, goneFrom = Infinity) => `<span class="grp">${Array.from({ length: n }, (_, k) => `<span class="${k >= goneFrom ? 'gone' : ''}">${ch}</span>`).join('')}</span>`;
    h.innerHTML = p.op === '+'
      ? `${grp(p.a, x)}<span class="mark">+</span>${grp(p.b, y)}`
      : grp(p.a, x, p.a - p.b);
  }
  const card = $('card');
  card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter');
  const box = $('answers');
  box.innerHTML = '';
  p.options.forEach(n => {
    const b = document.createElement('button');
    b.className = 'answer';
    b.textContent = n;
    b.dataset.n = n;
    b.onclick = () => answer(n, b);
    box.appendChild(b);
  });
  say(`${p.a} ${p.op === '+' ? 'plus' : 'minus'} ${p.b}?`);
}

function answer(n, btn) {
  if (!room || room.locked) return;
  const p = room.problems[room.at];
  const mascot = $('mascot');
  mascot.classList.remove('happy', 'sad'); void mascot.offsetWidth;
  if (n === p.ans) {
    room.locked = true;
    btn.classList.add('right');
    $('qBox').textContent = n; $('qBox').classList.add('solved');
    mascot.classList.add('happy');
    sfx.right(); sfx.star();
    say(['Correct!', 'Yes!', 'Super!', 'Great!'][Math.floor(Math.random() * 4)]);
    const from = center(btn);
    burst(from.x, from.y);
    const firstTry = room.mistakes === 0;
    room.stars.push(firstTry);
    // A star flies from the answer to its place on the path.
    const step = $('path').children[room.at];
    const to = center(step);
    const star = document.createElement('div');
    star.className = 'flystar';
    star.textContent = '⭐';
    star.style.left = from.x - 27 + 'px'; star.style.top = from.y - 27 + 'px';
    document.body.appendChild(star);
    requestAnimationFrame(() => { star.style.transform = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.6)`; });
    setTimeout(() => { star.remove(); step.classList.add('done'); step.textContent = firstTry ? '⭐' : '✨'; }, 720);
    setTimeout(() => {
      room.at++;
      if (room.at >= room.problems.length) finishRoom(); else showProblem();
    }, 1400);
  } else {
    room.mistakes++;
    btn.classList.add('wrong');
    mascot.classList.add('sad');
    const card = $('card');
    card.classList.remove('shake', 'enter'); void card.offsetWidth; card.classList.add('shake');
    sfx.wrong();
    say('Try again!');
    if (room.sel === n) room.sel = null;
    markAnswer();
  }
}
const answerButtons = () => [...$('answers').children].filter(b => !b.classList.contains('wrong'));
const markAnswer = () => [...$('answers').children].forEach(b => b.classList.toggle('sel', room.sel !== null && +b.dataset.n === room.sel));

// ═════════════ Treasure ═════════════
let doneSel = null;
function finishRoom() {
  screen = 'done';
  doneSel = null;
  const firstTries = room.stars.filter(Boolean).length;
  const key = `${room.door.key}_${settings.max}`;
  best[key] = Math.max(best[key] || 0, firstTries);
  saveBest();
  $('doneTitle').textContent = firstTries === room.stars.length ? 'Perfect!' : 'Great job!';
  $('doneStars').innerHTML = room.stars.map((s, k) => `<span style="animation-delay:${0.6 + k * 0.08}s">${s ? '⭐' : '✨'}</span>`).join('');
  const chest = $('chest');
  chest.classList.remove('open');
  $('done').classList.remove('hidden');
  markDone();
  sfx.fanfare();
  say('Great job!', 'You found the treasure!');
  setTimeout(() => {
    chest.classList.add('open');
    const c = center(chest);
    for (let k = 0; k < 18; k++) {
      const coin = document.createElement('div');
      coin.className = 'coin';
      coin.textContent = ['🪙', '💎', '⭐'][k % 3];
      coin.style.left = c.x + 'px'; coin.style.top = c.y + 'px';
      coin.style.setProperty('--dx', (Math.random() - 0.5) * 600 + 'px');
      coin.style.setProperty('--dy', -150 - Math.random() * 300 + 'px');
      $('fx').appendChild(coin);
      setTimeout(() => coin.remove(), 1500);
    }
  }, 500);
}
const doneButtons = () => [$('againBtn'), $('doorsBtn')];
const markDone = () => doneButtons().forEach((b, k) => b.classList.toggle('sel', k === doneSel));
$('againBtn').onclick = () => { sfx.click(); startRoom(room.i); };
$('doorsBtn').onclick = () => { sfx.click(); showHall(); };
$('backBtn').onclick = () => { sfx.click(); speechSynthesis?.cancel(); showHall(); };

// ═════════════ Settings ═════════════
function chips(boxId, options, get, set) {
  const box = $(boxId);
  box.innerHTML = '';
  options.forEach(([value, text]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (get() === value ? ' on' : '');
    b.textContent = text;
    b.onclick = () => { set(value); saveSettings(); sfx.select(); renderSettings(); renderHall(); };
    box.appendChild(b);
  });
}
function renderSettings() {
  chips('rangeChips', RANGES.map(r => [r, `0 – ${r}`]), () => settings.max, v => { settings.max = v; });
  chips('countChips', COUNTS.map(n => [n, String(n)]), () => settings.count, v => { settings.count = v; });
  chips('helpChips', [[true, '🍎 On'], [false, 'Off']], () => settings.help, v => { settings.help = v; });
  chips('voiceChips', [[true, '🗣️ On'], [false, 'Off']], () => settings.voice, v => { settings.voice = v; });
}
function openSettings() { renderSettings(); $('settings').classList.remove('hidden'); }
const closeSettings = () => $('settings').classList.add('hidden');
$('gearBtn').onclick = openSettings;
$('rangeBadge').onclick = openSettings;
$('settingsDone').onclick = () => { sfx.click(); closeSettings(); };
$('soundBtn').onclick = () => {
  soundOn = !soundOn;
  try { localStorage.setItem('md-sound', soundOn ? 'on' : 'off'); } catch (e) {}
  $('soundBtn').textContent = soundOn ? '🔊' : '🔇';
};
$('soundBtn').textContent = soundOn ? '🔊' : '🔇';
$('fsBtn').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {}));

// ═════════════ Keys and gamepad ═════════════
function press(key) {
  if (!$('settings').classList.contains('hidden')) { if (key === 'B') closeSettings(); return; }
  if (screen === 'hall') {
    if (busy) return;
    if (key === 'left' || key === 'right') {
      doorSel = doorSel === null ? 1 : Math.max(0, Math.min(2, doorSel + (key === 'left' ? -1 : 1)));
      markDoor(); sfx.select();
    }
    if (key === 'A') { if (doorSel === null) { doorSel = 1; markDoor(); sfx.select(); } else openDoor(doorSel); }
  } else if (screen === 'room') {
    if (key === 'B') { speechSynthesis?.cancel(); return showHall(); }
    if (room.locked) return;
    const vals = answerButtons().map(b => +b.dataset.n);
    if (key === 'left' || key === 'right' || (key === 'A' && room.sel === null)) {
      const k = vals.indexOf(room.sel);
      room.sel = k < 0 ? vals[Math.floor((vals.length - 1) / 2)] : vals[Math.max(0, Math.min(vals.length - 1, k + (key === 'left' ? -1 : key === 'right' ? 1 : 0)))];
      markAnswer(); sfx.select();
    } else if (key === 'A') {
      const btn = answerButtons().find(b => +b.dataset.n === room.sel);
      if (btn) answer(room.sel, btn);
    }
  } else if (screen === 'done') {
    if (key === 'left' || key === 'right' || (key === 'A' && doneSel === null)) {
      doneSel = doneSel === null ? 0 : key === 'left' ? 0 : key === 'right' ? 1 : doneSel;
      markDone(); sfx.select();
    } else if (key === 'A') doneButtons()[doneSel].click();
    else if (key === 'B') showHall();
  }
}

const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowUp: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'right', Enter: 'A', Space: 'A', Escape: 'B', Backspace: 'B', KeyX: 'B' };
addEventListener('keydown', e => {
  if (e.repeat || !KEYS[e.code]) return;
  e.preventDefault();
  press(KEYS[e.code]);
});

// Gamepad: D-pad / stick to choose, A to open or answer, B to go back.
const padPrev = {};
(function pollPad() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const now = { left: false, right: false, A: false, B: false };
  for (const p of pads) {
    const btn = i => !!p.buttons[i]?.pressed;
    now.left ||= btn(14) || btn(12) || (p.axes[0] || 0) < -0.5;
    now.right ||= btn(15) || btn(13) || (p.axes[0] || 0) > 0.5;
    now.A ||= btn(0); now.B ||= btn(1);
  }
  for (const k in now) { if (now[k] && !padPrev[k]) press(k); padPrev[k] = now[k]; }
  requestAnimationFrame(pollPad);
})();

showHall();
