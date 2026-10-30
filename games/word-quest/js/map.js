// The overworld: a meadow with a river, two bridges, paths, a cottage, trees and rocks.
// Generated anew every time, and always fully connected (every free tile can be reached).

import { mulberry32, randInt, shuffle } from './util.js';

export const GRASS = 0, PATH = 1, SAND = 2, WATER = 3, BRIDGE = 4, CAVE = 5, VOID = 6;

// A* on the tile grid. diag: allow diagonal steps (never cutting a blocked corner).
export function findPath(N, passable, from, to, { diag = true, cost = () => 1 } = {}) {
  const key = (i, j) => j * N + i;
  const h = (i, j) => {
    const dx = Math.abs(i - to.i), dy = Math.abs(j - to.j);
    return diag ? Math.max(dx, dy) + 0.414 * Math.min(dx, dy) : dx + dy;
  };
  const g = new Map([[key(from.i, from.j), 0]]);
  const came = new Map();
  const open = [{ i: from.i, j: from.j, f: h(from.i, from.j) }];
  const closed = new Set();
  const steps = diag
    ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k;
    const cur = open.splice(best, 1)[0];
    const ck = key(cur.i, cur.j);
    if (closed.has(ck)) continue;
    if (cur.i === to.i && cur.j === to.j) {
      const out = [{ i: cur.i, j: cur.j }];
      let k = ck;
      while (came.has(k)) { k = came.get(k); out.unshift({ i: k % N, j: Math.floor(k / N) }); }
      return out;
    }
    closed.add(ck);
    for (const [di, dj] of steps) {
      const ni = cur.i + di, nj = cur.j + dj;
      if (!passable(ni, nj)) continue;
      if (di && dj && (!passable(cur.i + di, cur.j) || !passable(cur.i, cur.j + dj))) continue;
      const nk = key(ni, nj);
      const ng = g.get(ck) + (di && dj ? 1.414 : 1) * cost(ni, nj);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, ck);
        open.push({ i: ni, j: nj, f: ng + h(ni, nj) });
      }
    }
  }
  return null;
}

export function generateMap(seed, cfg) {
  const rnd = mulberry32(seed);
  const N = cfg.size;
  const idx = (i, j) => j * N + i;
  const inside = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  const interior = (i, j) => i >= 2 && j >= 2 && i < N - 2 && j < N - 2;

  const ground = new Uint8Array(N * N).fill(GRASS);
  const obj = new Array(N * N).fill(null);      // { type: 'tree' | 'rock' | 'house' | 'block', variant }
  const flowers = new Int8Array(N * N).fill(-1);
  const reserved = new Uint8Array(N * N);

  // River runs along x, gently winding.
  const phase = rnd() * 10;
  const riverC = i => Math.round(N * 0.6 + Math.sin(i * 0.22 + phase) * 2.5);
  for (let i = 0; i < N; i++) for (let d = -1; d <= 1; d++) ground[idx(i, riverC(i) + d)] = WATER;

  // Two bridges.
  const bridges = [randInt(rnd, 6, 11), randInt(rnd, N - 12, N - 7)];
  bridges.forEach(b => {
    for (let d = -1; d <= 1; d++) ground[idx(b, riverC(b) + d)] = BRIDGE;
    reserved[idx(b, riverC(b) - 2)] = reserved[idx(b, riverC(b) + 2)] = 1;
  });

  // Cottage north of the river.
  let minC = N;
  for (let i = 0; i < N; i++) minC = Math.min(minC, riverC(i) - 1);
  const hx = randInt(rnd, 8, N - 14), hy = randInt(rnd, 4, Math.max(4, minC - 8));
  for (let j = hy; j < hy + 3; j++) for (let i = hx; i < hx + 3; i++) obj[idx(i, j)] = { type: 'block' };
  obj[idx(hx, hy)] = { type: 'house' };
  for (let j = hy - 1; j <= hy + 4; j++) for (let i = hx - 1; i <= hx + 3; i++) if (inside(i, j)) reserved[idx(i, j)] = 1;
  const door = { i: hx + 1, j: hy + 3 };

  // Dirt paths: door → each bridge, and on across the river.
  const noise = Array.from({ length: N * N }, () => rnd() * 0.8);
  const roadOk = (i, j) => interior(i, j) && ground[idx(i, j)] !== WATER && !obj[idx(i, j)];
  const road = (a, b) => {
    const p = findPath(N, roadOk, a, b, { diag: false, cost: (i, j) => 1 + noise[idx(i, j)] });
    (p || []).forEach(({ i, j }) => {
      if (ground[idx(i, j)] === GRASS) ground[idx(i, j)] = PATH;
      reserved[idx(i, j)] = 1;
    });
  };
  bridges.forEach((b, k) => {
    const c = riverC(b);
    road(door, { i: b, j: c - 2 });
    road({ i: b, j: c + 2 }, { i: Math.max(3, Math.min(N - 4, b + randInt(rnd, -3, 3))), j: N - 4 - k * 2 });
  });

  // Sandy banks.
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (ground[idx(i, j)] !== GRASS) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => inside(i + di, j + dj) && ground[idx(i + di, j + dj)] === WATER)) ground[idx(i, j)] = SAND;
  }

  // Forest edge: two rows of trees all around.
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!interior(i, j) && ground[idx(i, j)] !== WATER) obj[idx(i, j)] = { type: 'tree', variant: randInt(rnd, 0, 2) };
  }

  const walkable = (i, j) => inside(i, j) && ground[idx(i, j)] !== WATER && !obj[idx(i, j)];
  const start = { x: door.i + 0.5, y: door.j + 0.6 };
  for (let dj = -1; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (inside(door.i + di, door.j + dj)) reserved[idx(door.i + di, door.j + dj)] = 1;

  // Count tiles reachable from the start.
  const reachable = () => {
    const seen = new Uint8Array(N * N), q = [idx(door.i, door.j)];
    seen[q[0]] = 1;
    let n = 0;
    while (q.length) {
      const k = q.pop(); n++;
      const i = k % N, j = (k - i) / N;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (walkable(ni, nj) && !seen[idx(ni, nj)]) { seen[idx(ni, nj)] = 1; q.push(idx(ni, nj)); }
      }
    }
    return n;
  };
  let free = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (walkable(i, j)) free++;

  // Trees in soft clumps, a few rocks — each one kept only if nothing gets cut off.
  const p1 = rnd() * 6, p2 = rnd() * 6, p3 = rnd() * 6;
  const clump = (i, j) => (Math.sin(i * 0.45 + p1) + Math.sin(j * 0.4 + p2) + Math.sin((i + j) * 0.25 + p3)) / 6 + 0.5;
  const spots = [];
  for (let j = 2; j < N - 2; j++) for (let i = 2; i < N - 2; i++) if (walkable(i, j) && !reserved[idx(i, j)]) spots.push([i, j]);
  shuffle(rnd, spots).forEach(([i, j]) => {
    const r = rnd();
    const treeP = cfg.treeDensity * (0.2 + 1.8 * clump(i, j) ** 2);
    let o = null;
    if (r < treeP && ground[idx(i, j)] === GRASS) o = { type: 'tree', variant: randInt(rnd, 0, 2) };
    else if (r > 1 - cfg.rockDensity) o = { type: 'rock' };
    if (!o) return;
    obj[idx(i, j)] = o;
    if (reachable() === free - 1) free--;
    else obj[idx(i, j)] = null;
  });

  // Flowers on open grass.
  for (let j = 2; j < N - 2; j++) for (let i = 2; i < N - 2; i++) {
    if (ground[idx(i, j)] === GRASS && !obj[idx(i, j)] && rnd() < cfg.flowerDensity) flowers[idx(i, j)] = randInt(rnd, 0, 3);
  }

  // Grass tufts that sway in the wind (drawing only).
  const tufts = [];
  for (let j = 2; j < N - 2; j++) for (let i = 2; i < N - 2; i++) {
    if (ground[idx(i, j)] === GRASS && !obj[idx(i, j)] && rnd() < 0.35) {
      tufts.push({ i, j, ox: (rnd() - 0.5) * 30, oy: 6 + rnd() * 18, phase: rnd() * 6 });
    }
  }

  // Objects as a list for drawing (depth = sum of the footprint centre's coordinates).
  const objects = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const o = obj[idx(i, j)];
    if (!o || o.type === 'block') continue;
    if (o.type === 'house') objects.push({ type: 'house', x: i + 1.5, y: j + 1.5, depth: i + j + 3 });
    else objects.push({ type: o.type, variant: o.variant, x: i + 0.5, y: j + 0.5, depth: i + j + 1 });
  }

  // Scenery outside the map, so the camera never shows an empty edge: more forest, and the river flowing on.
  const MARGIN = 7;
  const outsideGround = (i, j) => (j >= 0 && j < N && Math.abs(j - riverC(i)) <= 1 ? WATER : GRASS);
  for (let j = -MARGIN; j < N + MARGIN; j++) for (let i = -MARGIN; i < N + MARGIN; i++) {
    if (inside(i, j) || outsideGround(i, j) === WATER || rnd() < 0.25) continue;
    objects.push({ type: 'tree', variant: randInt(rnd, 0, 2), x: i + 0.5, y: j + 0.5, depth: i + j + 1 });
  }

  // Nearest free tile to (i, j), for clicks on trees, water and so on.
  const nearestWalkable = (i, j) => {
    if (walkable(i, j)) return { i, j };
    for (let r = 1; r < N; r++) {
      let best = null, bestD = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !walkable(i + di, j + dj)) continue;
        const d = di * di + dj * dj;
        if (d < bestD) { bestD = d; best = { i: i + di, j: j + dj }; }
      }
      if (best) return best;
    }
    return null;
  };

  // Every tile the hero can walk to, with its walking distance from the start.
  const reachableTiles = () => {
    const dist = new Int32Array(N * N).fill(-1), q = [idx(door.i, door.j)], out = [];
    dist[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const k = q[h], i = k % N, j = (k - i) / N;
      out.push({ i, j, d: dist[k] });
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (walkable(ni, nj) && dist[idx(ni, nj)] < 0) { dist[idx(ni, nj)] = dist[k] + 1; q.push(idx(ni, nj)); }
      }
    }
    return out;
  };

  // Blocks a tile with a new object (a chest) only if every free tile stays reachable.
  const tryBlock = (i, j, o) => {
    if (!walkable(i, j)) return false;
    obj[idx(i, j)] = o;
    if (reachable() === free - 1) { free--; return true; }
    obj[idx(i, j)] = null;
    return false;
  };

  return {
    N, ground, obj, flowers, objects, start, door, bridges, MARGIN, reachableTiles, tryBlock,
    isRock: (i, j) => inside(i, j) && obj[idx(i, j)]?.type === 'rock',
    tufts, riverC,
    house: { x: hx + 1.5, y: hy + 1.5 },
    // Which side of the river a point is on (-1 north, 1 south).
    riverSide: (x, y) => Math.sign(y - (riverC(Math.floor(x)) + 0.5)) || 1,
    groundAt: (i, j) => (inside(i, j) ? ground[idx(i, j)] : outsideGround(i, j)),
    idx, inside, walkable, nearestWalkable,
    pathTo: (from, to) => findPath(N, walkable, from, to),
  };
}
