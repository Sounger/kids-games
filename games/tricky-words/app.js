// Tricky Words — the teacher types sentences; the class reads them together.
// Every word has its own colour; tricky words are always red. Point at a word
// (mouse, finger or arrow keys) and it grows big so every letter is easy to see.

const $ = id => document.getElementById(id);

// ── Sample content (the teacher replaces it in the ✏️ editor) ──
const SAMPLE = {
  sentences: [
    'I like to play with my dog.',
    'The cat said hello to me.',
    'We go to school by bus.',
    'She was here and you are my friend.',
    'They have one red ball.',
    'Come and see what I can do!',
  ],
  tricky: ['I', 'the', 'to', 'said', 'we', 'me', 'she', 'he', 'was', 'you', 'are', 'my', 'go', 'no', 'so',
    'be', 'they', 'here', 'there', 'like', 'come', 'some', 'have', 'do', 'of', 'one', 'all', 'what', 'by'],
};
// Word colours: bright, easy to read on white, none of them close to the tricky red.
const COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#c026d3', '#65a30d', '#4f46e5', '#0d9488', '#9333ea'];

let data = { sentences: [...SAMPLE.sentences], tricky: [...SAMPLE.tricky] };
try {
  const saved = JSON.parse(localStorage.getItem('tw-data') || 'null');
  if (saved && Array.isArray(saved.sentences) && Array.isArray(saved.tricky)) data = saved;
} catch (e) {}
const saveData = () => { try { localStorage.setItem('tw-data', JSON.stringify(data)); } catch (e) {} };
// Sentences come in a random order: `order` is a shuffled list of sentence numbers,
// `at` is the place in it. After the last one a new shuffle starts.
let at = 0, order = [];
function shuffleOrder() {
  const last = order[order.length - 1];
  order = data.sentences.map((_, k) => k);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  // Don't show the same sentence twice in a row across two rounds.
  if (order.length > 1 && order[0] === last) [order[0], order[1]] = [order[1], order[0]];
}
shuffleOrder();

// "Don't", "don’t" and "DON'T" all count as the same word.
const norm = w => w.toLowerCase().replace(/[’‘`]/g, "'");
const trickySet = () => new Set(data.tricky.map(norm));

// ── Sound: small synth, no files ──
let actx = null, soundOn = true;
try { soundOn = localStorage.getItem('tw-sound') !== 'off'; } catch (e) {}
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
  pop: k => tone(SCALE[k % SCALE.length], 0.18, { type: 'triangle', vol: 0.09, to: SCALE[k % SCALE.length] * 1.5 }),
  tricky: () => { tone(988, 0.12, { type: 'square', vol: 0.05 }); tone(1319, 0.25, { type: 'triangle', vol: 0.1, when: 0.09 }); tone(1760, 0.3, { vol: 0.06, when: 0.18 }); },
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
function sparkle(el, color, tricky) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const chars = tricky ? ['★', '✦', '❤'] : ['✦', '•', '✧'];
  const n = tricky ? 14 : 9;
  for (let k = 0; k < n; k++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.textContent = chars[k % chars.length];
    const a = (k / n) * Math.PI * 2 + Math.random() * 0.4, d = r.width * 0.7 + 30 + Math.random() * 50;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.color = k % 3 === 2 ? '#facc15' : color;
    s.style.setProperty('--s', 14 + Math.random() * 16 + 'px');
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d * 0.7 + 'px');
    $('fx').appendChild(s);
    setTimeout(() => s.remove(), 850);
  }
}

// ── Show one sentence ──
let words = [];      // the .word elements of the current sentence
let active = null;   // the word that is big now

function show(i, dir = 0) {
  const list = data.sentences;
  const box = $('sentence');
  setActive(null);
  if (!list.length) {
    box.innerHTML = '<div class="empty">No sentences yet.<br>Tap ✏️ to write some!</div>';
    words = [];
    renderDots();
    return;
  }
  at = Math.min(Math.max(i, 0), list.length - 1);
  const tricky = trickySet();
  box.innerHTML = '';
  let colorAt = order[at] * 3;   // each sentence starts on a different colour
  words = list[order[at]].split(/\s+/).filter(Boolean).map((token, n) => {
    // "hello," → "" + "hello" + ","
    const m = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    const [, lead, core, tail] = m && m[2] ? m : [null, '', token, ''];
    const isTricky = tricky.has(norm(core));
    const w = document.createElement('span');
    w.className = 'word' + (isTricky ? ' tricky' : '');
    w.style.setProperty('--n', n);
    w.style.setProperty('--tilt', (n % 2 ? 1 : -1) * (8 + (n * 7) % 14));
    const c = isTricky ? '#dc2626' : COLORS[colorAt++ % COLORS.length];
    w.style.setProperty('--c', c);
    w.dataset.color = c;
    const letters = [...core].map((ch, k) => `<span class="l" style="--i:${k}">${esc(ch)}</span>`).join('');
    w.innerHTML = `<span class="in">${lead ? `<span class="p">${esc(lead)}</span>` : ''}${letters}${tail ? `<span class="p">${esc(tail)}</span>` : ''}</span>`;
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
  data.sentences.forEach((_, k) => {
    const d = document.createElement('button');
    d.className = 'dot' + (k === at ? ' now' : '');
    d.title = `Sentence ${k + 1}`;
    d.onclick = () => go(k);
    box.appendChild(d);
  });
  $('prevBtn').disabled = at <= 0;
  $('nextBtn').disabled = data.sentences.length < 2;
}

function go(i) {
  // Past the last sentence: shuffle again and start a new round.
  if (i >= data.sentences.length && data.sentences.length > 1) { shuffleOrder(); sfx.whoosh(); show(0, 1); return; }
  if (i < 0 || i >= data.sentences.length || i === at) return;
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
  const tricky = w.classList.contains('tricky');
  tricky ? sfx.tricky() : sfx.pop(k);
  sparkle(w, w.dataset.color, tricky);
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
$('soundBtn').onclick = () => { soundOn = !soundOn; try { localStorage.setItem('tw-sound', soundOn ? 'on' : 'off'); } catch (e) {} soundIcon(); };
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
    // Walk word by word; past the last word go to the next sentence.
    if (k < words.length - 1) setActive(words[k + 1]); else go(at + 1);
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    if (k > 0) setActive(words[k - 1]); else if (k === 0) setActive(null); else go(at - 1);
    e.preventDefault();
  } else if (e.key === 'Escape') setActive(null);
});
addEventListener('resize', () => setActive(null));

// ── Editor ──
const splitTricky = text => [...new Set(text.split(/[\s,;]+/).map(w => w.trim()).filter(Boolean))];
function chipsPreview() {
  $('trickyChips').innerHTML = splitTricky($('trickyBox').value).map(w => `<span class="chip">${esc(w)}</span>`).join('');
}
function openEditor(content = data) {
  $('sentencesBox').value = content.sentences.join('\n');
  $('trickyBox').value = content.tricky.join(', ');
  chipsPreview();
  $('editor').classList.remove('hidden');
}
function closeEditor() { $('editor').classList.add('hidden'); }
$('editBtn').onclick = () => openEditor();
$('trickyBox').oninput = chipsPreview;
$('cancelBtn').onclick = closeEditor;
$('sampleBtn').onclick = () => openEditor(SAMPLE);   // fills the boxes; nothing is saved until ✔ Save
$('saveBtn').onclick = () => {
  data = {
    sentences: $('sentencesBox').value.split(/\r?\n/).map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean),
    tricky: splitTricky($('trickyBox').value),
  };
  saveData();
  closeEditor();
  shuffleOrder();
  show(0);
};

soundIcon();
show(0);
