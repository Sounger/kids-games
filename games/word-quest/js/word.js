// The word of this session: where its letters lie on the map, and which slot each one fills.

import { BRIDGE } from './map.js';
import { shuffle } from './util.js';

export function createWord(entry, map, cfg, rnd = Math.random) {
  const letters = [...entry.word.toUpperCase()];

  // Spread the letters over the map: far from the start and from each other.
  const spots = shuffle(rnd, map.reachableTiles().filter(t => t.d >= cfg.minFromStart && map.ground[map.idx(t.i, t.j)] !== BRIDGE));
  const chosen = [];
  for (let gap = cfg.spread; chosen.length < letters.length && gap >= 0; gap--) {
    for (const t of spots) {
      if (chosen.length >= letters.length) break;
      if (chosen.includes(t)) continue;
      if (chosen.every(c => Math.hypot(c.i - t.i, c.j - t.j) >= gap)) chosen.push(t);
    }
  }

  return {
    word: letters.join(''),
    pic: entry.pic,
    slots: letters.map(ch => ({ ch, taken: false })),   // taken: a flying letter is on its way
    items: letters.map((ch, n) => ({
      ch, color: n,
      x: chosen[n].i + 0.5, y: chosen[n].j + 0.5,
      phase: rnd() * Math.PI * 2,
      picked: false,
    })),
    // Picks up an item and returns the slot index it flies to (first free slot with that letter).
    take(item) {
      item.picked = true;
      const slot = this.slots.findIndex(s => s.ch === item.ch && !s.taken);
      this.slots[slot].taken = true;
      return slot;
    },
    get left() { return this.items.filter(it => !it.picked); },
  };
}
