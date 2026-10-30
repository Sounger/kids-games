// The owl's hint: where is the nearest letter we still need? Described by things a child can see.

import { WATER, BRIDGE } from './map.js';
import { letterName } from './voice.js';

// Distance from (x, y) to the nearest tile of a ground type, looking up to `max` tiles away.
function nearGround(map, x, y, type, max) {
  let best = Infinity;
  const ci = Math.floor(x), cj = Math.floor(y);
  for (let dj = -max; dj <= max; dj++) for (let di = -max; di <= max; di++) {
    const i = ci + di, j = cj + dj;
    if (map.inside(i, j) && map.ground[map.idx(i, j)] === type) best = Math.min(best, Math.hypot(i + 0.5 - x, j + 0.5 - y));
  }
  return best;
}
function countNear(map, x, y, test, r) {
  let n = 0;
  for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const i = Math.floor(x) + di, j = Math.floor(y) + dj;
    if (map.inside(i, j) && test(i, j)) n++;
  }
  return n;
}

export function describePlace(map, item, hero) {
  const { x, y } = item;
  const across = map.riverSide(x, y) !== map.riverSide(hero.x, hero.y);
  let place = null, emoji = '👀';
  if (nearGround(map, x, y, BRIDGE, 3) <= 2.6) { place = 'near the bridge'; emoji = '🌉'; }
  else if (Math.hypot(x - map.house.x, y - map.house.y) <= 4.5) { place = 'near the house'; emoji = '🏠'; }
  else if (nearGround(map, x, y, WATER, 3) <= 2.6) { place = across ? null : 'by the river'; emoji = '🌊'; }
  else if (countNear(map, x, y, (i, j) => map.isRock(i, j), 1) > 0) { place = 'by the rocks'; emoji = '🪨'; }
  else if (countNear(map, x, y, (i, j) => map.flowers[map.idx(i, j)] >= 0, 1) >= 2) { place = 'in the flowers'; emoji = '🌼'; }
  else if (x < 6 || y < 6 || x > map.N - 6 || y > map.N - 6) { place = 'by the big trees'; emoji = '🌲'; }

  let where = [across ? 'across the river' : null, place].filter(Boolean).join(', ');
  if (!where) where = 'not far away';
  const chest = item.chest ? 'in a chest ' : '';
  return {
    speech: `The letter ${letterName(item.ch)} is ${chest}${where}!`,
    emoji: (item.chest ? '🧰' : '') + (across && emoji !== '🌊' ? '🌊' : '') + emoji,
  };
}
