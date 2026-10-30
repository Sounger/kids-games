// The hero: walks with the D-pad / keys, or follows a path after a mouse click.

const HOP_TIME = 0.4, CLAP_TIME = 0.4;

// D-pad → world direction. 'iso': along the grid (screen diagonals); 'screen': straight up/down/left/right.
export function dpadToWorld(dirs, mode) {
  let dx = 0, dy = 0;
  if (mode === 'screen') {
    if (dirs.up) { dx -= 1; dy -= 1; }
    if (dirs.down) { dx += 1; dy += 1; }
    if (dirs.left) { dx -= 1; dy += 1; }
    if (dirs.right) { dx += 1; dy -= 1; }
  } else {
    if (dirs.up) dy -= 1;
    if (dirs.down) dy += 1;
    if (dirs.left) dx -= 1;
    if (dirs.right) dx += 1;
  }
  const len = Math.hypot(dx, dy);
  return len ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
}

export class Hero {
  constructor(x, y, cfg) {
    this.x = x; this.y = y;
    this.cfg = cfg;
    this.facing = 'front';
    this.walking = false;
    this.walkTime = 0;
    this.path = null;      // list of {x, y} points to walk through
    this.target = null;    // tile the mouse path ends on (for the marker)
    this.hopT = -1;
    this.clapT = -1;
  }

  get depth() { return this.x + this.y; }
  get z() { return this.hopT >= 0 ? Math.sin(Math.PI * this.hopT / HOP_TIME) * 10 : 0; }
  get clap() { return this.clapT >= 0 ? this.clapT / CLAP_TIME : -1; }

  hop() { if (this.hopT >= 0) return false; this.hopT = 0; return true; }
  doClap() { this.clapT = 0; }

  walkPath(tiles, target) {
    this.path = tiles.slice(1).map(t => ({ x: t.i + 0.5, y: t.j + 0.5 }));
    this.target = this.path.length ? target : null;
    if (!this.path.length) this.path = null;
  }
  stopPath() { this.path = null; this.target = null; }

  update(dt, move, map) {
    if (this.hopT >= 0) { this.hopT += dt; if (this.hopT >= HOP_TIME) this.hopT = -1; }
    if (this.clapT >= 0) { this.clapT += dt; if (this.clapT >= CLAP_TIME) this.clapT = -1; }

    const step = this.cfg.speed * dt;
    let dx = 0, dy = 0;
    if (move.x || move.y) {
      this.stopPath();
      dx = move.x * step; dy = move.y * step;
      this.moveWithCollisions(dx, dy, map);
    } else if (this.path) {
      const p = this.path[0];
      const ddx = p.x - this.x, ddy = p.y - this.y, d = Math.hypot(ddx, ddy);
      if (d <= step) {
        dx = ddx; dy = ddy;
        this.x = p.x; this.y = p.y;
        this.path.shift();
        if (!this.path.length) this.stopPath();
      } else {
        dx = ddx / d * step; dy = ddy / d * step;
        this.x += dx; this.y += dy;
      }
    }

    this.walking = Math.abs(dx) + Math.abs(dy) > 1e-4;
    if (this.walking) {
      this.walkTime += dt;
      const screenDy = dx + dy;           // moving up or down on screen
      if (screenDy < -1e-4) this.facing = 'back';
      else if (screenDy > 1e-4) this.facing = 'front';
    } else this.walkTime = 0;
  }

  // Free movement: try x and y separately so the hero slides along trees and the river.
  moveWithCollisions(dx, dy, map) {
    const r = this.cfg.radius;
    const free = (x, y) =>
      map.walkable(Math.floor(x - r), Math.floor(y - r)) && map.walkable(Math.floor(x + r), Math.floor(y - r)) &&
      map.walkable(Math.floor(x - r), Math.floor(y + r)) && map.walkable(Math.floor(x + r), Math.floor(y + r));
    if (free(this.x + dx, this.y)) this.x += dx;
    if (free(this.x, this.y + dy)) this.y += dy;
  }

  frame() {
    if (!this.walking) return 'stand';
    return ['walkA', 'stand', 'walkB', 'stand'][Math.floor(this.walkTime / 0.12) % 4];
  }
}
