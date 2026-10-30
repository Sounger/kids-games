// HTML on top of the map: the word bar, the letter slots, flying letters, word and victory screens.

import { LETTER_COLORS } from './sprites.js';

const $ = id => document.getElementById(id);

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// A word's picture: an emoji (text) or an uploaded image (data URL).
export const picHTML = pic => (/^data:image\//.test(pic || '') ? `<img class="pic-img" src="${esc(pic)}" alt="">` : esc(pic || ''));

export function setupWordUI(word) {
  $('barPic').innerHTML = picHTML(word.pic);
  $('barWord').textContent = word.word;
  const slots = $('slots');
  slots.innerHTML = '';
  word.slots.forEach(() => {
    const s = document.createElement('div');
    s.className = 'slot';
    slots.appendChild(s);
  });
  $('showPic').innerHTML = picHTML(word.pic);
  $('showWord').innerHTML = '';
  for (const ch of word.word) {
    const s = document.createElement('span');
    s.textContent = ch;
    $('showWord').appendChild(s);
  }
  $('winPic').innerHTML = picHTML(word.pic);
  $('winWord').textContent = word.word;
}

// Lights up letter n of the big word while the voice spells it (-1 = none).
export function highlightLetter(n) {
  [...$('showWord').children].forEach((s, i) => s.classList.toggle('lit', i === n));
}

// A letter flies in an arc from the map (from = page position) into its slot, then onDone().
export function flyLetter(ch, colorIdx, from, slotIndex, onDone) {
  const slot = $('slots').children[slotIndex];
  const to = slot.getBoundingClientRect();
  const [face, side] = LETTER_COLORS[colorIdx % LETTER_COLORS.length];
  const el = document.createElement('div');
  el.className = 'flyer';
  el.textContent = ch;
  el.style.color = face;
  el.style.textShadow = `4px 4px 0 ${side}, -3px 0 0 #2b2140, 3px 0 0 #2b2140, 0 -3px 0 #2b2140, 0 3px 0 #2b2140`;
  document.body.appendChild(el);

  const end = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
  const ctrl = { x: (from.x + end.x) / 2, y: Math.min(from.y, end.y) - innerHeight * 0.25 };
  const dur = 900, t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const x = (1 - e) ** 2 * from.x + 2 * (1 - e) * e * ctrl.x + e * e * end.x;
    const y = (1 - e) ** 2 * from.y + 2 * (1 - e) * e * ctrl.y + e * e * end.y;
    const scale = 1 + Math.sin(t * Math.PI) * 0.5;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale}) rotate(${t * 360}deg)`;
    if (t < 1) return requestAnimationFrame(step);
    el.remove();
    slot.textContent = ch;
    slot.style.color = face;
    slot.style.textShadow = `4px 4px 0 ${side}`;
    slot.classList.add('filled');
    onDone();
  }
  requestAnimationFrame(step);
}

// The other way: a letter jumps out of its slot and falls onto the map (to = page position).
export function flyFromSlot(ch, colorIdx, slotIndex, to, onDone) {
  const slot = $('slots').children[slotIndex];
  const r = slot.getBoundingClientRect();
  const from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  slot.textContent = '';
  slot.style.color = ''; slot.style.textShadow = '';
  slot.classList.remove('filled');
  const [face, side] = LETTER_COLORS[colorIdx % LETTER_COLORS.length];
  const el = document.createElement('div');
  el.className = 'flyer';
  el.textContent = ch;
  el.style.color = face;
  el.style.textShadow = `4px 4px 0 ${side}, -3px 0 0 #2b2140, 3px 0 0 #2b2140, 0 -3px 0 #2b2140, 0 3px 0 #2b2140`;
  document.body.appendChild(el);
  const ctrl = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - innerHeight * 0.3 };
  const dur = 900, t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    const x = (1 - t) ** 2 * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x;
    const y = (1 - t) ** 2 * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1.4 - t * 0.6}) rotate(${-t * 540}deg)`;
    if (t < 1) return requestAnimationFrame(step);
    el.remove();
    onDone();
  }
  requestAnimationFrame(step);
}

// Thought bubble: the decoy crossed out, then the letters still needed in their colours.
export function showBubble(decoy, missing, word) {
  const b = $('bubble');
  b.innerHTML = '';
  const no = document.createElement('span');
  no.className = 'no';
  no.textContent = decoy;
  b.appendChild(no);
  for (const ch of missing) {
    const s = document.createElement('span');
    const [face, side] = LETTER_COLORS[word.indexOf(ch) % LETTER_COLORS.length];
    s.textContent = ch;
    s.style.color = face;
    s.style.textShadow = `3px 3px 0 ${side}`;
    b.appendChild(s);
  }
  b.classList.remove('hidden');
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
}
// The owl's bubble: the letter in its colour and a picture of the place.
export function showHintBubble(ch, word, emoji) {
  const b = $('bubble');
  const [face, side] = LETTER_COLORS[word.indexOf(ch) % LETTER_COLORS.length];
  b.innerHTML = `<span style="color:${face};text-shadow:3px 3px 0 ${side}">${ch}</span><span class="bubble-emoji">${emoji}</span>`;
  b.classList.remove('hidden');
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
}
export function placeBubble(pos) {
  const b = $('bubble');
  b.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -100%)`;
}
export const hideBubble = () => $('bubble').classList.add('hidden');

// ── Chest window: the sum and three answer buttons ──
export const mathBox = {
  open(problem, onClick) {
    $('mathText').textContent = problem.text;
    const box = $('answers');
    box.innerHTML = '';
    problem.options.forEach(n => {
      const b = document.createElement('button');
      b.className = 'answer';
      b.textContent = n;
      b.dataset.value = n;
      b.onclick = () => onClick(n);
      box.appendChild(b);
    });
    $('math').classList.remove('hidden');
  },
  close() { $('math').classList.add('hidden'); },
  // Buttons still in play (wrong ones disappear).
  buttons() { return [...$('answers').children].filter(b => !b.classList.contains('gone')); },
  select(value) {
    for (const b of $('answers').children) b.classList.toggle('selected', +b.dataset.value === value);
  },
  wrong(value) {
    const b = [...$('answers').children].find(b => +b.dataset.value === value);
    b?.classList.add('gone');
    const card = $('mathCard');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  },
  right(value) {
    const b = [...$('answers').children].find(b => +b.dataset.value === value);
    b?.classList.add('right');
    $('mathText').textContent = $('mathText').textContent.replace('?', value);
  },
};

// ── "Choose a word" screen (when the teacher picks words by hand) ──
export const picker = {
  open(words, onPick) {
    const grid = $('pickGrid');
    grid.innerHTML = '';
    words.forEach((w, i) => {
      const b = document.createElement('button');
      b.className = 'pick-card';
      b.dataset.i = i;
      b.innerHTML = `<span class="pic">${picHTML(w.pic) || '❔'}</span><span class="w">${esc(w.word)}</span>`;
      b.onclick = () => onPick(i);
      grid.appendChild(b);
    });
  },
  select(i) { [...$('pickGrid').children].forEach((b, k) => b.classList.toggle('selected', k === i)); $('pickGrid').children[i]?.scrollIntoView({ block: 'nearest' }); },
  // How many cards fit in one row (for moving up and down with the D-pad).
  columns() {
    const cards = [...$('pickGrid').children];
    if (cards.length < 2) return 1;
    const top = cards[0].offsetTop;
    const n = cards.findIndex(c => c.offsetTop !== top);
    return n < 0 ? cards.length : n;
  },
};

// ── "Who is playing?" screen ──
export const whoScreen = {
  // cards: [{ avatar, name, note }]
  open(cards, onPick) {
    const grid = $('whoGrid');
    grid.innerHTML = '';
    cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'pick-card';
      b.innerHTML = `<span class="pic">${esc(c.avatar)}</span><span class="w">${esc(c.name)}</span>${c.note ? `<span class="stars-small">${esc(c.note)}</span>` : ''}`;
      b.onclick = () => onPick(i);
      grid.appendChild(b);
    });
  },
  select(i) { [...$('whoGrid').children].forEach((b, k) => b.classList.toggle('selected', k === i)); $('whoGrid').children[i]?.scrollIntoView({ block: 'nearest' }); },
  columns() {
    const cards = [...$('whoGrid').children];
    if (cards.length < 2) return 1;
    const n = cards.findIndex(c => c.offsetTop !== cards[0].offsetTop);
    return n < 0 ? cards.length : n;
  },
};

export function confetti() {
  const bits = ['⭐', '🎉', '✨', '🌟', '🎈', '💛', '🍬'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.textContent = bits[i % bits.length];
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDuration = 2.2 + Math.random() * 2 + 's';
    c.style.animationDelay = Math.random() * 0.8 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
}
