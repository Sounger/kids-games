// Rainbow Words — the teacher types a list of words; one word fills the screen,
// every letter in its own colour. Point at a letter (mouse, finger or arrow keys)
// and it grows big and hops, so the class can look at it sound by sound.
// Digraphs (sh, oi, ay…) stay together: one colour of their own, and they pop up as one.

const $ = id => document.getElementById(id);

// ── Sample content (the teacher replaces it in the ✏️ editor) ──
const SAMPLE = {
  words: ['cat', 'dog', 'sun', 'pig', 'fish', 'ship', 'frog', 'shell', 'rain', 'snail', 'boy', 'coin', 'tray', 'oil'],
  digraphs: ['sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'qu', 'ai', 'ay', 'oi', 'oy', 'ee', 'ea', 'oa', 'oo',
    'ou', 'ow', 'ar', 'or', 'er', 'ir', 'ur', 'igh', 'air', 'ear', 'tch'],
};
// Letter colours: bright and easy to read on white. Next letters never share a colour.
const COLORS = ['#ef4444', '#f59e0b', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#65a30d', '#ea580c', '#9333ea'];
// Digraphs have their own colour that single letters never get.
const DIGRAPH_COLOR = '#db2777';

let data = { words: [...SAMPLE.words], digraphs: [...SAMPLE.digraphs] };
try {
  const saved = JSON.parse(localStorage.getItem('rw-data') || 'null');
  if (saved && Array.isArray(saved.words)) data = saved;
  else if (saved && Array.isArray(saved.groups)) data = { words: saved.groups.flat() };   // older version kept groups
  if (!Array.isArray(data.digraphs)) data.digraphs = [...SAMPLE.digraphs];
} catch (e) {}

// Cut a word into pieces: digraphs from the list (longest first) and single letters.
// "snail" → s, n, ai, l
function chunks(word) {
  const list = [...new Set(data.digraphs.map(d => d.toLowerCase()))].sort((a, b) => b.length - a.length);
  const out = [];
  for (let i = 0; i < word.length;) {
    const d = list.find(d => d.length > 1 && word.toLowerCase().startsWith(d, i));
    const len = d ? d.length : 1;
    out.push({ text: word.slice(i, i + len), digraph: !!d });
    i += len;
  }
  return out;
}
const saveData = () => { try { localStorage.setItem('rw-data', JSON.stringify(data)); } catch (e) {} };
// Words come in a random order: `order` is a shuffled list of word numbers,
// `at` is the place in it. After the last one a new shuffle starts.
let at = 0, order = [];
function shuffleOrder() {
  const last = order[order.length - 1];
  order = data.words.map((_, k) => k);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  // Don't show the same word twice in a row across two rounds.
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
  // Each letter has its own note, going up the word.
  // A digraph: two quick notes that slide up together — "wow!".
  digraph: () => { tone(660, 0.14, { type: 'square', vol: 0.05, to: 990 }); tone(990, 0.3, { type: 'triangle', vol: 0.1, when: 0.1, to: 1480 }); },
  pop: k => tone(SCALE[k % SCALE.length], 0.2, { type: 'triangle', vol: 0.09, to: SCALE[k % SCALE.length] * 1.5 }),
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

// ── Sparkles around a letter ──
function sparkle(el, color) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const chars = ['★', '✦', '•', '✧'];
  const n = 14;
  for (let k = 0; k < n; k++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.textContent = chars[k % chars.length];
    const a = (k / n) * Math.PI * 2 + Math.random() * 0.4, d = r.width * 0.8 + 40 + Math.random() * 60;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.color = k % 2 ? color : COLORS[k % COLORS.length];
    s.style.setProperty('--s', 16 + Math.random() * 18 + 'px');
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d * 0.7 + 'px');
    $('fx').appendChild(s);
    setTimeout(() => s.remove(), 850);
  }
}

// ── Show one word ──
// Every letter is its own .word element, so the "grow on hover" styles from
// Tricky Words work letter by letter here.
let letters = [];    // the letter elements of the current word
let active = null;   // the letter that is big now

// The word is as big as the screen allows: long words get a smaller font.
function fitWord() {
  const box = $('sentence'), n = Math.max(box.textContent.length, 1);
  const cardW = $('card').clientWidth - 40;
  const fs = Math.min(320, innerHeight * 0.34, (cardW * 0.9) / (n * 0.62 + 0.1));
  box.style.fontSize = Math.max(40, fs).toFixed(0) + 'px';
}

function show(i, dir = 0) {
  const list = data.words;
  const box = $('sentence');
  setActive(null);
  if (!list.length) {
    box.style.fontSize = '';
    box.innerHTML = '<div class="empty">No words yet.<br>Tap ✏️ to write some!</div>';
    letters = [];
    renderDots();
    return;
  }
  at = Math.min(Math.max(i, 0), list.length - 1);
  box.innerHTML = '';
  let colorAt = order[at] * 3;   // each word starts on a different colour
  letters = chunks(list[order[at]]).map(({ text, digraph }, n) => {
    const c = digraph ? DIGRAPH_COLOR : COLORS[colorAt++ % COLORS.length];
    const w = document.createElement('span');
    w.className = 'word' + (digraph ? ' dg' : '');
    w.style.setProperty('--n', n);
    w.style.setProperty('--tilt', (n % 2 ? 1 : -1) * (8 + (n * 7) % 14));
    w.style.setProperty('--c', c);
    w.dataset.color = c;
    w.innerHTML = `<span class="in">${[...text].map((ch, k) => `<span class="l" style="--i:${k};--lc:${c}">${esc(ch)}</span>`).join('')}</span>`;
    box.appendChild(w);
    return w;
  });
  fitWord();
  const card = $('card');
  card.animate(dir ? [
    { transform: `translateX(${dir * 60}px) rotate(${dir * 2}deg)`, opacity: 0.2 },
    { transform: 'none', opacity: 1 },
  ] : [{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  renderDots();
}
const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// Dots for a short list; "3 / 40" for a long one.
function renderDots() {
  const box = $('dots');
  box.innerHTML = '';
  if (data.words.length > 20) box.innerHTML = `<span class="count">${at + 1} / ${data.words.length}</span>`;
  else data.words.forEach((_, k) => {
    const d = document.createElement('button');
    d.className = 'dot' + (k === at ? ' now' : '');
    d.title = `Word ${k + 1}`;
    d.onclick = () => go(k);
    box.appendChild(d);
  });
  $('prevBtn').disabled = at <= 0;
  $('nextBtn').disabled = data.words.length < 2;
}

function go(i) {
  // Past the last word: shuffle again and start a new round.
  if (i >= data.words.length && data.words.length > 1) { shuffleOrder(); sfx.whoosh(); show(0, 1); return; }
  if (i < 0 || i >= data.words.length || i === at) return;
  const dir = i > at ? 1 : -1;
  sfx.whoosh();
  show(i, dir);
}

// ── Make one letter big ──
function setActive(w) {
  if (w === active) return;
  if (active) {
    active.classList.remove('on');
    active.style.removeProperty('--zoom'); active.style.removeProperty('--sx');
  }
  letters.forEach(x => x.classList.remove('near'));
  active = w;
  if (!w) return;
  // Grow as much as the screen allows, and nudge in from the edges.
  const r = w.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = innerHeight;
  const zoom = Math.max(1, Math.min(1.6, (vw * 0.9) / r.width, (vh * 0.62) / r.height));
  const half = (r.width * zoom) / 2 + 0.15 * r.height, cx = r.left + r.width / 2, pad = 10;
  let sx = 0;
  if (cx - half < pad) sx = pad - (cx - half);
  if (cx + half > vw - pad) sx = vw - pad - (cx + half);
  w.style.setProperty('--zoom', zoom.toFixed(2));
  w.style.setProperty('--sx', sx.toFixed(0) + 'px');
  w.classList.add('on');
  const k = letters.indexOf(w);
  [letters[k - 1], letters[k + 1]].forEach(x => x && x.classList.add('near'));
  if (w.classList.contains('dg')) sfx.digraph(); else sfx.pop(k);
  sparkle(w, w.dataset.color);
}

// Mouse: hover. Finger: touch and slide along the word.
const letterAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('.word') || null;
const stage = document.querySelector('.stage');
stage.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'pen') setActive(letterAt(e.clientX, e.clientY));
});
stage.addEventListener('pointerdown', e => { setActive(letterAt(e.clientX, e.clientY)); });
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
  const k = letters.indexOf(active);
  if (e.key === 'PageDown' || e.key === 'Enter' || e.key === 'ArrowDown') { go(at + 1); e.preventDefault(); }
  else if (e.key === 'PageUp' || e.key === 'ArrowUp') { go(at - 1); e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === ' ') {
    // Walk letter by letter; past the last letter go to the next word.
    if (k < letters.length - 1) setActive(letters[k + 1]); else go(at + 1);
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    if (k > 0) setActive(letters[k - 1]); else if (k === 0) setActive(null); else go(at - 1);
    e.preventDefault();
  } else if (e.key === 'Escape') setActive(null);
});
addEventListener('resize', () => { setActive(null); fitWord(); });

// ── Editor ──
// Words are split by spaces, commas, semicolons or new lines.
const splitWords = text => text.split(/[\s,;]+/).map(w => w.trim()).filter(Boolean);
function openEditor(content = data) {
  $('wordsBox').value = content.words.join(', ');
  $('digraphsBox').value = content.digraphs.join(', ');
  digraphChips();
  $('editor').classList.remove('hidden');
}
function digraphChips() {
  $('digraphChips').innerHTML = splitWords($('digraphsBox').value).map(d => `<span class="chip">${esc(d)}</span>`).join('');
}
$('digraphsBox').oninput = digraphChips;
function closeEditor() { $('editor').classList.add('hidden'); }
$('editBtn').onclick = () => openEditor();
$('cancelBtn').onclick = closeEditor;
$('sampleBtn').onclick = () => openEditor(SAMPLE);   // fills the box; nothing is saved until ✔ Save
$('saveBtn').onclick = () => {
  data = { words: splitWords($('wordsBox').value), digraphs: splitWords($('digraphsBox').value) };
  saveData();
  closeEditor();
  shuffleOrder();
  show(0);
};

soundIcon();
show(0);
