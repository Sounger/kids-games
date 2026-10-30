// HTML on top of the map: the word bar, the letter slots, flying letters, word and victory screens.

import { LETTER_COLORS } from './sprites.js';

const $ = id => document.getElementById(id);

export function setupWordUI(word) {
  $('barPic').textContent = word.pic;
  $('barWord').textContent = word.word;
  const slots = $('slots');
  slots.innerHTML = '';
  word.slots.forEach(() => {
    const s = document.createElement('div');
    s.className = 'slot';
    slots.appendChild(s);
  });
  $('showPic').textContent = word.pic;
  $('showWord').textContent = word.word;
  $('winPic').textContent = word.pic;
  $('winWord').textContent = word.word;
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
