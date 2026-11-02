// Rainbow Words — the teacher types groups of words; every letter has its own colour.
// One group fills the screen. Point at a word (mouse, finger or arrow keys) and it
// grows big so every letter is easy to see.

const $ = id => document.getElementById(id);

// ── Sample content (the teacher replaces it in the ✏️ editor) ──
const SAMPLE = {
  groups: [
    ['cat', 'hat', 'bat', 'mat'],
    ['dog', 'log', 'frog', 'fog'],
    ['sun', 'run', 'fun', 'bun'],
    ['pig', 'big', 'dig', 'wig'],
    ['fish', 'ship', 'shop', 'shell'],
    ['rain', 'snail', 'boy', 'coin'],
  ],
};
// Letter colours: bright and easy to read on white. Next letters never share a colour.
const COLORS = ['#ef4444', '#f59e0b', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#65a30d', '#ea580c', '#9333ea'];

let data = { groups: SAMPLE.groups.map(g => [...g]) };
try {
  const saved = JSON.parse(localStorage.getItem('rw-data') || 'null');
  if (saved && Array.isArray(saved.groups)) data = saved;
} catch (e) {}
const saveData = () => { try { localStorage.setItem('rw-data', JSON.stringify(data)); } catch (e) {} };
// Groups come in a random order: `order` is a shuffled list of group numbers,
// `at` is the place in it. After the last one a new shuffle starts.
let at = 0, order = [];
function shuffleOrder() {
  const last = order[order.length - 1];
  order = data.groups.map((_, k) => k);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  // Don't show the same group twice in a row across two rounds.
  if (order.length > 1 && order[0] === last) [order[0], order[1]] = [order[1], order[0]];
}
shuffleOrder();

// ── Sound: small synth, no files ──
let actx = null, soundOn = true;
try { soundOn = localStorage.getItem('rw-sound') !== 'off'; } catch (e) {}
function ac() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { return null; }
  return actx;
}
addEventListener('pointerdown', ac, { capture: true });
addEventListener('keydown', ac, { capture: true });
function tone(f, dur, { type = 'sine', vol = 0.12, when = 0, to = null } = {}) {
  if (!soundOn || !actx || actx.state !== 'running') return;
  const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319];
const sfx = {
  // A quick rising run, one note per letter.
  pop: (k, letters) => { for (let j = 0; j < Math.min(letters, 6); j++) tone(SCALE[(k + j) % SCALE.length], 0.16, { type: 'triangle', vol: 0.07, when: j * 0.05 }); },
  whoosh: () => tone(300, 0.35, { type: 'triangle', vol: 0.06, to: 900 }),
};

// ── Background balloons ──
(function sky() {
  const tints = ['#fca5a5', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4', '#a5f3fc'];
  for (let k = 0; k < 14; k++) {
    const b = document.createElement('div');
    const s = 50 + Math.random() * 110;
    b.className = 'blob';
    Object.assign(b.style, {
      left: Math.random() * 100 + 'vw', width: s + 'px', height: s + 'px',
      background: tints[k % tints.length],
      animationDuration: 18 + Math.random() * 22 + 's', animationDelay: -Math.random() * 40 + 's',
    });
    $('sky').appendChild(b);
  }
})();

// ── Sparkles around a word ──
function sparkle(el) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const chars = ['★', '✦', '•', '✧'];
  const n = 14;
  for (let k = 0; k < n; k++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.textContent = chars[k % chars.length];
    const a = (k / n) * Math.PI * 2 + Math.random() * 0.4, d = r.width * 0.7 + 30 + Math.random() * 50;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.color = COLORS[k % COLORS.length];
    s.style.setProperty('--s', 14 + Math.random() * 16 + 'px');
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d * 0.7 + 'px');
    $('fx').appendChild(s);
    setTimeout(() => s.remove(), 850);
  }
}

// ── Show one group ──
let words = [];      // the .word elements of the current group
let active = null;   // the word that is big now

function show(i, dir = 0) {
  const list = data.groups;
  const box = $('sentence');
  setActive(null);
  if (!list.length) {
    box.innerHTML = '<div class="empty">No words yet.<br>Tap ✏️ to write some!</div>';
    words = [];
    renderDots();
    return;
  }
  at = Math.min(Math.max(i, 0), list.length - 1);
  box.innerHTML = '';
  let colorAt = order[at] * 3;   // each group starts on a different colour
  words = list[order[at]].map((word, n) => {
    const w = document.createElement('span');
    w.className = 'word';
    w.style.setProperty('--n', n);
    w.style.setProperty('--tilt', (n % 2 ? 1 : -1) * (8 + (n * 7) % 14));
    // The halo behind the big word takes the colour of its first letter.
    w.style.setProperty('--c', COLORS[colorAt % COLORS.length]);
    const letters = [...word].map((ch, k) => `<span class="l" style="--i:${k};--lc:${COLORS[colorAt++ % COLORS.length]}">${esc(ch)}</span>`).join('');
    colorAt += 2;   // so the next word doesn't continue the same rainbow
    w.innerHTML = `<span class="in">${letters}</span>`;
    box.appendChild(w);
    return w;
  });
  const card = $('card');
  card.animate(dir ? [
    { transform: `translateX(${dir * 60}px) rotate(${dir * 2}deg)`, opacity: 0.2 },
    { transform: 'none', opacity: 1 },
  ] : [{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  renderDots();
}
const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function renderDots() {
  const box = $('dots');
  box.innerHTML = '';
  data.groups.forEach((_, k) => {
    const d = document.createElement('button');
    d.className = 'dot' + (k === at ? ' now' : '');
    d.title = `Group ${k + 1}`;
    d.onclick = () => go(k);
    box.appendChild(d);
  });
  $('prevBtn').disabled = at <= 0;
  $('nextBtn').disabled = data.groups.length < 2;
}

function go(i) {
  // Past the last group: shuffle again and start a new round.
  if (i >= data.groups.length && data.groups.length > 1) { shuffleOrder(); sfx.whoosh(); show(0, 1); return; }
  if (i < 0 || i >= data.groups.length || i === at) return;
  const dir = i > at ? 1 : -1;
  sfx.whoosh();
  show(i, dir);
}

// ── Make one word big ──
function setActive(w) {
  if (w === active) return;
  if (active) {
    active.classList.remove('on');
    active.style.removeProperty('--zoom'); active.style.removeProperty('--sx');
  }
  words.forEach(x => x.classList.remove('near'));
  active = w;
  if (!w) return;
  // Keep the big word inside the screen: shrink the zoom for long words, nudge it in from the edges.
  // The big word also gets wider letter spacing (0.08em per letter) and a frame.
  const r = w.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  const fs = parseFloat(getComputedStyle(w).fontSize);
  const width = r.width + (w.textContent.length * 0.08 + 0.2) * fs;
  const zoom = Math.max(1, Math.min(1.9, (vw * 0.9) / width));
  const half = (width * zoom) / 2, cx = r.left + r.width / 2, pad = 10;
  let sx = 0;
  if (cx - half < pad) sx = pad - (cx - half);
  if (cx + half > vw - pad) sx = vw - pad - (cx + half);
  w.style.setProperty('--zoom', zoom.toFixed(2));
  w.style.setProperty('--sx', sx.toFixed(0) + 'px');
  w.classList.add('on');
  const k = words.indexOf(w);
  [words[k - 1], words[k + 1]].forEach(x => x && x.classList.add('near'));
  sfx.pop(k, w.textContent.length);
  sparkle(w);
}

// Mouse: hover. Finger: touch and slide along the line.
const wordAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('.word') || null;
const stage = document.querySelector('.stage');
stage.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'pen') setActive(wordAt(e.clientX, e.clientY));
});
stage.addEventListener('pointerdown', e => { setActive(wordAt(e.clientX, e.clientY)); });
let liftTimer = null;
stage.addEventListener('pointerup', e => {
  if (e.pointerType === 'mouse') return;
  clearTimeout(liftTimer);
  const w = active;
  liftTimer = setTimeout(() => { if (active === w) setActive(null); }, 1200);
});
stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setActive(null); });

// ── Buttons and keys ──
$('prevBtn').onclick = () => go(at - 1);
$('nextBtn').onclick = () => go(at + 1);
function soundIcon() { $('soundBtn').textContent = soundOn ? '🔊' : '🔇'; $('soundBtn').classList.toggle('off', !soundOn); }
$('soundBtn').onclick = () => { soundOn = !soundOn; try { localStorage.setItem('rw-sound', soundOn ? 'on' : 'off'); } catch (e) {} soundIcon(); };
$('fsBtn').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
};
addEventListener('keydown', e => {
  if (!$('editor').classList.contains('hidden')) { if (e.key === 'Escape') closeEditor(); return; }
  const k = words.indexOf(active);
  if (e.key === 'PageDown' || e.key === 'Enter' || e.key === 'ArrowDown') { go(at + 1); e.preventDefault(); }
  else if (e.key === 'PageUp' || e.key === 'ArrowUp') { go(at - 1); e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === ' ') {
    // Walk word by word; past the last word go to the next group.
    if (k < words.length - 1) setActive(words[k + 1]); else go(at + 1);
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    if (k > 0) setActive(words[k - 1]); else if (k === 0) setActive(null); else go(at - 1);
    e.preventDefault();
  } else if (e.key === 'Escape') setActive(null);
});
addEventListener('resize', () => setActive(null));

// ── Editor ──
// One line = one group; words are split by spaces, commas or semicolons.
const splitWords = line => line.split(/[\s,;]+/).map(w => w.trim()).filter(Boolean);
function openEditor(content = data) {
  $('wordsBox').value = content.groups.map(g => g.join(' ')).join('\n');
  $('editor').classList.remove('hidden');
}
function closeEditor() { $('editor').classList.add('hidden'); }
$('editBtn').onclick = () => openEditor();
$('cancelBtn').onclick = closeEditor;
$('sampleBtn').onclick = () => openEditor(SAMPLE);   // fills the box; nothing is saved until ✔ Save
$('saveBtn').onclick = () => {
  data = { groups: $('wordsBox').value.split(/\r?\n/).map(splitWords).filter(g => g.length) };
  saveData();
  closeEditor();
  shuffleOrder();
  show(0);
};

soundIcon();
show(0);
