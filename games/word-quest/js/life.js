// Things that make the map feel alive: butterflies, birds, drifting cloud shadows, weather,
// and flowers that bloom where a letter was picked up.

export function createLife(map, weatherOn, rnd = Math.random) {
  const tiles = map.reachableTiles();
  const flowerTiles = tiles.filter(t => map.flowers[map.idx(t.i, t.j)] >= 0);
  // Butterflies like flowers best.
  const spot = () => {
    const from = flowerTiles.length && rnd() < 0.7 ? flowerTiles : tiles;
    const t = from[Math.floor(rnd() * from.length)];
    return { x: t.i + 0.5, y: t.j + 0.5 };
  };

  const butterflies = Array.from({ length: 6 }, (_, k) => {
    const p = spot();
    return { x: p.x, y: p.y, goal: spot(), color: k % 4, phase: rnd() * 6, z: 14 + rnd() * 10, speed: 0.6 + rnd() * 0.5 };
  });

  // Cloud shadows drift across the whole map and come round again.
  const N = map.N;
  const clouds = Array.from({ length: 4 }, () => ({ x: rnd() * N, y: rnd() * N, r: 2.5 + rnd() * 2.5 }));

  // Birds fly across the screen now and then (screen coordinates).
  const birds = [];
  let birdT = 4 + rnd() * 8;

  // Weather: mostly sunny; sometimes light rain or evening light.
  const r = rnd();
  const weather = !weatherOn ? 'clear' : r < 0.2 ? 'rain' : r < 0.4 ? 'evening' : 'clear';
  const drops = Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), v: 0.9 + rnd() * 0.5 }));

  const blooms = [];   // { i, j, t } — a flower growing where a letter was

  function update(dt, view) {
    for (const b of butterflies) {
      b.phase += dt;
      const dx = b.goal.x - b.x, dy = b.goal.y - b.y, d = Math.hypot(dx, dy);
      if (d < 0.2) b.goal = spot();
      else {
        const wob = Math.sin(b.phase * 3) * 0.6;
        b.x += (dx / d + -dy / d * wob) * b.speed * dt;
        b.y += (dy / d + dx / d * wob) * b.speed * dt;
      }
    }
    for (const c of clouds) {
      c.x += 0.35 * dt; c.y -= 0.12 * dt;
      if (c.x > N + 8) { c.x = -8; c.y = rnd() * N; }
      if (c.y < -8) c.y = N + 8;
    }
    birdT -= dt;
    if (birdT <= 0) {
      birdT = 15 + rnd() * 15;
      const y = 20 + rnd() * view.h * 0.35, dir = rnd() < 0.5 ? 1 : -1;
      for (let k = 0; k < 3; k++) birds.push({ x: dir > 0 ? -20 - k * 14 : view.w + 20 + k * 14, y: y + k * 7 * (k % 2 ? 1 : -1), vx: dir * 45, flap: rnd() * 2 });
    }
    for (const b of birds) { b.x += b.vx * dt; b.flap += dt; }
    for (let k = birds.length - 1; k >= 0; k--) if (birds[k].x < -60 || birds[k].x > view.w + 60) birds.splice(k, 1);
    for (const d of drops) { d.y += d.v * dt * 1.6; d.x -= d.v * dt * 0.3; if (d.y > 1) { d.y -= 1; d.x = rnd() * 1.2; } if (d.x < 0) d.x += 1; }
    for (const b of blooms) b.t += dt;
  }

  // A flower pops up where a letter lay (only on open ground).
  function bloom(x, y) {
    const i = Math.floor(x), j = Math.floor(y);
    if (!map.inside(i, j) || !map.walkable(i, j)) return;
    map.flowers[map.idx(i, j)] = Math.floor(rnd() * 4);
    blooms.push({ i, j, t: 0 });
  }

  return { butterflies, clouds, birds, drops, weather, blooms, update, bloom };
}
