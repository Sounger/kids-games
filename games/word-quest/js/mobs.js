// Friendly pests — nobody gets hurt, nothing is lost for good:
//   raccoon — wanders; if it catches the hero it knocks one collected letter back onto the ground, then runs off
//   slime   — creeps around near a chest; touching it bounces the hero back; a clap (B) scares it away
//   bee     — circles over flowers; touching it makes the hero slow and dizzy for a moment

import { shuffle } from './util.js';

const RACCOON = { wander: 1.4, chase: 2.2, flee: 4.2, sees: 4.5, rest: 18 };
const SLIME = { speed: 0.6, leash: 2.2, scared: 4 };
const BEE = { radius: 1.4, speed: 1.6 };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function createMobs(map, word, rnd = Math.random) {
  const mobs = [];
  const tiles = map.reachableTiles();
  const center = t => ({ x: t.i + 0.5, y: t.j + 0.5 });

  // One raccoon, away from the start.
  const far = shuffle(rnd, tiles.filter(t => t.d >= 10));
  if (far.length) mobs.push({ type: 'raccoon', ...center(far[0]), mode: 'wander', goal: null, stuck: 0, rest: 6, modeT: 0, anim: 0 });

  // Up to two slimes, each next to a chest.
  for (const chest of word.chests.slice(0, 2)) {
    const near = tiles.filter(t => Math.hypot(t.i + 0.5 - chest.x, t.j + 0.5 - chest.y) <= 2.2 && t.d >= 4);
    if (!near.length) continue;
    const t = near[Math.floor(rnd() * near.length)];
    mobs.push({ type: 'slime', ...center(t), home: { x: chest.x, y: chest.y }, goal: null, scaredT: 0, hitT: 0, anim: rnd() * 6 });
  }

  // One bee over a patch of flowers.
  const flowers = shuffle(rnd, tiles.filter(t => t.d >= 6 && map.flowers[map.idx(t.i, t.j)] >= 0));
  if (flowers.length) {
    const c = center(flowers[0]);
    mobs.push({ type: 'bee', cx: c.x, cy: c.y, x: c.x, y: c.y, ang: rnd() * 6, hitT: 0, anim: 0 });
  }

  // Walk with the same bumping rules as the hero.
  const move = (m, dx, dy, r = 0.3) => {
    const free = (x, y) => map.walkable(Math.floor(x - r), Math.floor(y - r)) && map.walkable(Math.floor(x + r), Math.floor(y - r)) &&
      map.walkable(Math.floor(x - r), Math.floor(y + r)) && map.walkable(Math.floor(x + r), Math.floor(y + r));
    const ox = m.x, oy = m.y;
    if (free(m.x + dx, m.y)) m.x += dx;
    if (free(m.x, m.y + dy)) m.y += dy;
    return Math.abs(m.x - ox) + Math.abs(m.y - oy) > 1e-4;
  };
  const steer = (m, tx, ty, speed, dt) => {
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (d < 0.05) return false;
    const s = Math.min(d, speed * dt);
    return move(m, dx / d * s, dy / d * s);
  };
  const randomGoal = (m, radius) => {
    const opts = tiles.filter(t => Math.abs(t.i + 0.5 - m.x) <= radius && Math.abs(t.j + 0.5 - m.y) <= radius);
    return opts.length ? center(opts[Math.floor(rnd() * opts.length)]) : null;
  };

  function update(dt, hero, on) {
    for (const m of mobs) {
      m.anim += dt;
      if (m.type === 'raccoon') {
        m.modeT += dt;
        m.rest = Math.max(0, m.rest - dt);
        if (m.mode === 'flee') {
          // Run away from the hero for a while.
          const dx = m.x - hero.x, dy = m.y - hero.y, d = Math.hypot(dx, dy) || 1;
          if (!move(m, dx / d * RACCOON.flee * dt, dy / d * RACCOON.flee * dt)) move(m, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3);
          if (m.modeT > 3) { m.mode = 'wander'; m.goal = null; }
        } else if (m.mode === 'chase') {
          steer(m, hero.x, hero.y, RACCOON.chase, dt);
          if (dist(m, hero) > RACCOON.sees + 2 || m.rest > 0) { m.mode = 'wander'; m.goal = null; }
          if (dist(m, hero) < 0.6) { on.raccoon(m); m.mode = 'flee'; m.modeT = 0; m.rest = RACCOON.rest; }
        } else {
          if (!m.goal || dist(m, m.goal) < 0.1 || m.stuck > 1) { m.goal = randomGoal(m, 5); m.stuck = 0; }
          if (m.goal && !steer(m, m.goal.x, m.goal.y, RACCOON.wander, dt)) m.stuck += dt;
          if (m.rest <= 0 && dist(m, hero) < RACCOON.sees) { m.mode = 'chase'; m.modeT = 0; }
        }
      } else if (m.type === 'slime') {
        m.hitT = Math.max(0, m.hitT - dt);
        if (m.scaredT > 0) {
          // Scared: hop away from the hero, staying near its chest.
          m.scaredT -= dt;
          const dx = m.x - hero.x, dy = m.y - hero.y, d = Math.hypot(dx, dy) || 1;
          if (dist(m, hero) < 4) move(m, dx / d * SLIME.speed * 2.5 * dt, dy / d * SLIME.speed * 2.5 * dt);
        } else {
          if (!m.goal || dist(m, m.goal) < 0.1) {
            const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * (SLIME.leash - 0.8);
            m.goal = { x: m.home.x + Math.cos(a) * r, y: m.home.y + Math.sin(a) * r };
          }
          if (!steer(m, m.goal.x, m.goal.y, SLIME.speed, dt)) m.goal = null;
          if (m.hitT <= 0 && dist(m, hero) < 0.65) { m.hitT = 1.2; on.slime(m); }
        }
      } else if (m.type === 'bee') {
        m.hitT = Math.max(0, m.hitT - dt);
        m.ang += dt * BEE.speed;
        m.x = m.cx + Math.cos(m.ang) * BEE.radius;
        m.y = m.cy + Math.sin(m.ang) * BEE.radius * 0.8;
        if (m.hitT <= 0 && dist(m, hero) < 0.55) { m.hitT = 4; on.bee(m); }
      }
    }
  }

  // A clap scares slimes (and makes the raccoon run off).
  function clap(hero) {
    let scared = 0;
    for (const m of mobs) {
      if (dist(m, hero) > 3.5) continue;
      if (m.type === 'slime') { m.scaredT = SLIME.scared; m.goal = null; scared++; }
      if (m.type === 'raccoon' && m.mode !== 'flee') { m.mode = 'flee'; m.modeT = 0; m.rest = Math.max(m.rest, 8); scared++; }
    }
    return scared;
  }

  return { list: mobs, update, clap };
}
