// The word of this session: where its letters lie on the map (some locked in chests),
// and which slot each one fills.

import { BRIDGE } from './map.js';
import { shuffle } from './util.js';

export function createWord(entry, map, cfg, chestCfg, decoyCfg, rnd = Math.random) {
  const letters = [...entry.word.toUpperCase()];
  // Decoys: letters that are not in the word.
  const others = shuffle(rnd, [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(ch => !letters.includes(ch)));
  const decoys = decoyCfg.enabled ? others.slice(0, decoyCfg.count) : [];
  const all = [...letters, ...decoys];

  // Spread the letters over the map: far from the start and from each other.
  const spots = shuffle(rnd, map.reachableTiles().filter(t => t.d >= cfg.minFromStart && map.ground[map.idx(t.i, t.j)] !== BRIDGE));
  const chosen = [];
  for (let gap = cfg.spread; chosen.length < all.length && gap >= 0; gap--) {
    for (const t of spots) {
      if (chosen.length >= all.length) break;
      if (chosen.includes(t)) continue;
      if (chosen.every(c => Math.hypot(c.i - t.i, c.j - t.j) >= gap)) chosen.push(t);
    }
  }

  const items = all.slice(0, chosen.length).map((ch, n) => ({
    ch, color: n,
    x: chosen[n].i + 0.5, y: chosen[n].j + 0.5,
    phase: rnd() * Math.PI * 2,
    picked: false,
    chest: null,
    decoy: n >= letters.length,
    rejectT: -1,          // decoys: time since the hero touched it (it shakes, bounces off, goes "poof")
  }));

  // Lock some letters in chests. A chest blocks its tile, so it is only put where it cuts nothing off.
  const chests = [];
  const want = letters.length < 2 ? 0 : Math.min(letters.length - 1, Math.max(1, Math.round(letters.length * chestCfg.share)));
  for (const item of shuffle(rnd, items.filter(it => !it.decoy))) {
    if (chests.length >= want) break;
    const i = Math.floor(item.x), j = Math.floor(item.y);
    if (!map.tryBlock(i, j, { type: 'chest' })) continue;
    const chest = { x: item.x, y: item.y, i, j, item, open: false, shakeT: -1 };
    item.chest = chest;
    chests.push(chest);
  }

  return {
    word: letters.join(''),
    pic: entry.pic,
    slots: letters.map(ch => ({ ch, taken: false })),   // taken: a flying letter is on its way
    items,
    chests,
    // Picks up an item and returns the slot index it flies to (first free slot with that letter).
    take(item) {
      item.picked = true;
      const slot = this.slots.findIndex(s => s.ch === item.ch && !s.taken);
      this.slots[slot].taken = true;
      return slot;
    },
    // Letters lying free on the ground.
    get left() { return this.items.filter(it => !it.picked && !it.chest); },
    get closedChests() { return this.chests.filter(c => !c.open); },
    get rejected() { return this.items.filter(it => it.rejectT >= 0); },
    // Letters still needed, each once, in word order: ['P', 'L', 'E'].
    get missing() { return [...new Set(this.slots.filter(s => !s.taken).map(s => s.ch))]; },
  };
}
