// Simple sums for the chests: a + b or a − b, everything within 0…max, and three answers to pick from.

import { randInt, shuffle } from './util.js';

export function makeProblem(cfg, rnd = Math.random) {
  const max = cfg.max;
  const op = cfg.ops === 'both' ? (rnd() < 0.5 ? '+' : '-') : cfg.ops;
  let a, b, answer;
  if (op === '+') {
    answer = randInt(rnd, 2, max);
    a = randInt(rnd, 1, answer - 1);
    b = answer - a;
  } else {
    a = randInt(rnd, 2, max);
    b = randInt(rnd, 1, a);
    answer = a - b;
  }

  // Two wrong answers close to the right one (±1…±3), different and inside 0…max.
  const near = shuffle(rnd, [-3, -2, -1, 1, 2, 3]).map(d => answer + d).filter(n => n >= 0 && n <= max);
  const wrong = near.slice(0, 2);
  for (let d = 4; wrong.length < 2; d++) [answer + d, answer - d].forEach(n => { if (wrong.length < 2 && n >= 0 && n <= max) wrong.push(n); });

  return {
    a, b, op, answer,
    text: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`,
    speech: `${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`,
    options: shuffle(rnd, [answer, ...wrong]),
  };
}
