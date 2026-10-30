// The secret cave under the meadow: a small dark maze with crystals (bonus), sometimes a
// golden letter (fills an empty slot by itself) and sometimes a chest with a sum.
// It offers the same map interface as the overworld, so walking, paths and drawing just work.

import { findPath, CAVE, VOID } from './map.js';
import { mulberry32, shuffle } from './util.js';

const N = 20;

export function createCave(seed, word) {
  const rnd = mulberry32(seed);
  const idx = (i, j) => j * N + i;
  const inside = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  let floor, obj;

  // Cellular automaton caves; keep only the biggest connected part, retry if it is too small.
  for (let attempt = 0; attempt < 20; attempt++) {
    let wall = Array.from({ length: N * N }, (_, k) => {
      const i = k % N, j = Math.floor(k / N);
      return i < 1 || j < 1 || i >= N - 1 || j >= N - 1 || rnd() < 0.42;
    });
    for (let it = 0; it < 4; it++) {
      wall = wall.map((w, k) => {
        const i = k % N, j = Math.floor(k / N);
        if (i < 1 || j < 1 || i >= N - 1 || j >= N - 1) return true;
        let n = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && wall[idx(i + di, j + dj)]) n++;
        return n >= 5 || (n <= 1 && rnd() < 0.3);
      });
    }
    // Flood from the open tile nearest the middle.
    let seedK = -1, best = Infinity;
    wall.forEach((w, k) => { if (!w) { const d = Math.hypot(k % N - N / 2, Math.floor(k / N) - N / 2); if (d < best) { best = d; seedK = k; } } });
    if (seedK < 0) continue;
    const seen = new Uint8Array(N * N), q = [seedK];
    seen[seedK] = 1;
    for (let h = 0; h < q.length; h++) {
      const k = q[h], i = k % N, j = (k - i) / N;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = idx(i + di, j + dj);
        if (inside(i + di, j + dj) && !wall[nk] && !seen[nk]) { seen[nk] = 1; q.push(nk); }
      }
    }
    if (q.length < 90) continue;
    floor = seen;
    break;
  }
  if (!floor) {   // very unlikely: fall back to a plain room
    floor = new Uint8Array(N * N).map((_, k) => (k % N > 2 && k % N < N - 3 && k / N > 3 && k / N < N - 3 ? 1 : 0));
  }
  obj = new Array(N * N).fill(null);

  const walkable = (i, j) => inside(i, j) && floor[idx(i, j)] && !obj[idx(i, j)];
  const bfs = from => {
    const dist = new Int32Array(N * N).fill(-1), q = [idx(from.i, from.j)], out = [];
    dist[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const k = q[h], i = k % N, j = (k - i) / N;
      out.push({ i, j, d: dist[k] });
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (walkable(i + di, j + dj) && dist[idx(i + di, j + dj)] < 0) { dist[idx(i + di, j + dj)] = dist[k] + 1; q.push(idx(i + di, j + dj)); }
      }
    }
    return out;
  };
  let freeCount = 0;
  for (let k = 0; k < N * N; k++) if (floor[k]) freeCount++;
  const floorTiles = [];
  for (let k = 0; k < N * N; k++) if (floor[k]) floorTiles.push({ i: k % N, j: Math.floor(k / N) });

  // The ladder (way out) stands on a tile; the hero starts right next to it.
  let ladder = null, start = null;
  for (const t of shuffle(rnd, floorTiles.slice())) {
    const next = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, b]) => ({ i: t.i + a, j: t.j + b })).find(n => walkable(n.i, n.j));
    if (!next) continue;
    obj[idx(t.i, t.j)] = { type: 'ladder' };
    if (bfs(next).length === freeCount - 1) { ladder = { x: t.i + 0.5, y: t.j + 0.5, i: t.i, j: t.j }; start = next; freeCount--; break; }
    obj[idx(t.i, t.j)] = null;
  }

  const tiles = bfs(start).filter(t => t.d >= 2);
  const far = tiles.slice().sort((a, b) => b.d - a.d);
  const used = new Set();
  const take = t => used.add(idx(t.i, t.j));
  const free = t => !used.has(idx(t.i, t.j));

  // Golden letter (2 times out of 3, while a letter is still missing) — at the far end.
  let golden = null;
  const missing = word.missing;
  if (missing.length && rnd() < 0.67 && far.length) {
    const t = far[0]; take(t);
    golden = { ch: missing[Math.floor(rnd() * missing.length)], color: -2, golden: true, x: t.i + 0.5, y: t.j + 0.5, phase: 0, picked: false };
  }

  // A chest with a sum (every other cave) — worth three crystals.
  let chest = null;
  if (rnd() < 0.5) {
    for (const t of far.slice(Math.floor(far.length / 3))) {
      if (!free(t)) continue;
      obj[idx(t.i, t.j)] = { type: 'chest' };
      if (bfs(start).length === freeCount - 1) { chest = { x: t.i + 0.5, y: t.j + 0.5, i: t.i, j: t.j, open: false, shakeT: -1, bonus: 3 }; take(t); freeCount--; break; }
      obj[idx(t.i, t.j)] = null;
    }
  }

  // Crystals spread around.
  const crystals = [];
  for (const t of shuffle(rnd, tiles.slice())) {
    if (crystals.length >= 8) break;
    if (!free(t) || !walkable(t.i, t.j) || crystals.some(c => Math.hypot(c.x - t.i - 0.5, c.y - t.j - 0.5) < 2.5)) continue;
    take(t);
    crystals.push({ x: t.i + 0.5, y: t.j + 0.5, got: false, phase: rnd() * 6 });
  }

  // Scenery: rock blocks around the open space (some with crystals), glowing mushrooms.
  const objects = [];
  for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) {
    if (inside(i, j) && floor[idx(i, j)]) continue;
    let nearFloor = false;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (inside(i + di, j + dj) && floor[idx(i + di, j + dj)]) nearFloor = true;
    if (nearFloor) objects.push({ type: 'wall', variant: rnd() < 0.2 ? 2 : Math.floor(rnd() * 2), x: i + 0.5, y: j + 0.5, depth: i + j + 1 });
  }
  objects.push({ type: 'ladder', x: ladder.x, y: ladder.y, depth: ladder.x + ladder.y });
  const mushrooms = [];
  for (const t of shuffle(rnd, tiles.slice())) {
    if (mushrooms.length >= 10) break;
    if (!free(t) || !walkable(t.i, t.j)) continue;
    take(t);
    const m = { type: 'mushroom', variant: Math.floor(rnd() * 2), x: t.i + 0.3 + rnd() * 0.4, y: t.j + 0.3 + rnd() * 0.4 };
    m.depth = m.x + m.y;
    mushrooms.push(m);
    objects.push(m);
  }

  const fireflies = Array.from({ length: 12 }, () => {
    const t = tiles[Math.floor(rnd() * tiles.length)];
    return { x: t.i + 0.5, y: t.j + 0.5, vx: 0, vy: 0, z: 10 + rnd() * 20, phase: rnd() * 6 };
  });

  const ground = new Uint8Array(N * N).map((_, k) => (floor[k] ? CAVE : VOID));
  const map = {
    N, ground, obj, objects, idx, inside, walkable,
    flowers: new Int8Array(N * N).fill(-1), tufts: [], MARGIN: 2,
    bg: '#0b0a14', dark: true,
    groundAt: (i, j) => (inside(i, j) ? ground[idx(i, j)] : VOID),
    isRock: () => false,
    reachableTiles: () => bfs(start),
    pathTo: (from, to) => findPath(N, walkable, from, to),
    nearestWalkable(i, j) {
      if (walkable(i, j)) return { i, j };
      for (let r = 1; r < N; r++) {
        let best = null, bestD = Infinity;
        for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !walkable(i + di, j + dj)) continue;
          if (di * di + dj * dj < bestD) { bestD = di * di + dj * dj; best = { i: i + di, j: j + dj }; }
        }
        if (best) return best;
      }
      return null;
    },
  };

  function update(dt) {
    for (const f of fireflies) {
      f.phase += dt;
      f.vx += (rnd() - 0.5) * dt * 2; f.vy += (rnd() - 0.5) * dt * 2;
      f.vx *= 0.98; f.vy *= 0.98;
      const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
      if (inside(Math.floor(nx), Math.floor(ny)) && floor[idx(Math.floor(nx), Math.floor(ny))]) { f.x = nx; f.y = ny; } else { f.vx *= -1; f.vy *= -1; }
    }
    for (const c of crystals) c.phase += dt;
  }

  // Everything that shines through the dark (world positions and radius in art pixels).
  function lights(hero) {
    return [
      { x: hero.x, y: hero.y, r: 115, lift: 18 },
      ...crystals.filter(c => !c.got).map(c => ({ x: c.x, y: c.y, r: 26, lift: 14 })),
      ...mushrooms.map(m => ({ x: m.x, y: m.y, r: 20, lift: 6 })),
      { x: ladder.x, y: ladder.y, r: 46, lift: 24 },
      ...(golden && !golden.picked ? [{ x: golden.x, y: golden.y, r: 44, lift: 20 }] : []),
      ...(chest && !chest.open ? [{ x: chest.x, y: chest.y, r: 26, lift: 10 }] : []),
      ...fireflies.map(f => ({ x: f.x, y: f.y, r: 12, lift: f.z })),
    ];
  }

  return {
    map, start: { x: start.i + 0.5, y: start.j + 0.5 }, ladder, crystals, golden, chest, fireflies, mushrooms,
    visited: false, update, lights,
  };
}
