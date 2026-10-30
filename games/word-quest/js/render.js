// Draws the world into a small "art pixel" canvas, then scales it up by a whole number
// onto the screen canvas, so pixels stay sharp on the projector.

import { TW, TH, toScreen, toWorld } from './iso.js';
import { GRASS, PATH, SAND, WATER, BRIDGE } from './map.js';
import { makeCanvas } from './util.js';
import { getLetterSprite } from './sprites.js';

export function createRenderer(canvas, sprites, viewCfg) {
  const screen = canvas.getContext('2d');
  const low = makeCanvas(viewCfg.baseWidth, viewCfg.baseHeight);
  const ctx = low.ctx;
  const view = { scale: 1, w: viewCfg.baseWidth, h: viewCfg.baseHeight, dpr: 1 };
  const cam = { x: 0, y: 0 };

  function resize() {
    view.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * view.dpr);
    canvas.height = Math.round(innerHeight * view.dpr);
    view.scale = Math.max(1, Math.floor(Math.min(canvas.width / viewCfg.baseWidth, canvas.height / viewCfg.baseHeight)));
    view.w = Math.ceil(canvas.width / view.scale);
    view.h = Math.ceil(canvas.height / view.scale);
    low.c.width = view.w; low.c.height = view.h;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  addEventListener('resize', resize);

  const offset = () => ({ x: Math.round(view.w / 2 - cam.x), y: Math.round(view.h / 2 - cam.y) });

  function follow(hero, dt, snap = false) {
    const t = toScreen(hero.x, hero.y);
    const k = snap ? 1 : 1 - Math.exp(-dt * 7);
    cam.x += (t.x - cam.x) * k;
    cam.y += (t.y - 20 - cam.y) * k;
  }

  // Screen click → world position (in tiles).
  function screenToWorld(clientX, clientY) {
    const o = offset();
    const lx = clientX * view.dpr / view.scale, ly = clientY * view.dpr / view.scale;
    return toWorld(lx - o.x, ly - o.y);
  }

  // World position (in tiles) → page position in CSS pixels, for HTML effects flying out of the map.
  function worldToClient(x, y, lift = 0) {
    const o = offset(), s = toScreen(x, y);
    return { x: (s.x + o.x) * view.scale / view.dpr, y: (s.y + o.y - lift) * view.scale / view.dpr };
  }

  function tileHash(i, j) { return ((i * 73856093) ^ (j * 19349663)) >>> 0; }

  function draw(map, hero, time, word) {
    const o = offset();
    ctx.fillStyle = '#245a32';
    ctx.fillRect(0, 0, view.w, view.h);

    // 1. Ground
    const waterFrame = Math.floor(time * 3) % sprites.water.length;
    for (let j = -map.MARGIN; j < map.N + map.MARGIN; j++) {
      for (let i = -map.MARGIN; i < map.N + map.MARGIN; i++) {
        const s = toScreen(i, j);
        const x = s.x + o.x - TW / 2, y = s.y + o.y;
        if (x > view.w || x + TW < 0 || y > view.h || y + TH < 0) continue;
        const inMap = map.inside(i, j), k = inMap ? map.idx(i, j) : -1;
        const g = map.groundAt(i, j), hsh = tileHash(i + 100, j + 100);
        let img;
        if (g === GRASS) img = sprites.grass[hsh % sprites.grass.length];
        else if (g === PATH) img = sprites.path[hsh % sprites.path.length];
        else if (g === SAND) img = sprites.sand[hsh % sprites.sand.length];
        else if (g === WATER) img = sprites.water[waterFrame];
        else if (g === BRIDGE) img = sprites.bridge;
        ctx.drawImage(img, x, y);
        if (inMap && map.flowers[k] >= 0) ctx.drawImage(sprites.flowers[map.flowers[k]], x, y);
      }
    }

    // 2. Where the mouse path ends — a pulsing diamond.
    if (hero.target) {
      const s = toScreen(hero.target.i + 0.5, hero.target.j + 0.5);
      const pulse = 0.75 + Math.sin(time * 8) * 0.15;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + o.x, s.y + o.y - TH / 2 * pulse);
      ctx.lineTo(s.x + o.x + TW / 2 * pulse, s.y + o.y);
      ctx.lineTo(s.x + o.x, s.y + o.y + TH / 2 * pulse);
      ctx.lineTo(s.x + o.x - TW / 2 * pulse, s.y + o.y);
      ctx.closePath();
      ctx.stroke();
    }

    // 3. Shadows
    const hs = toScreen(hero.x, hero.y);
    const heroPt = { x: hs.x + o.x, y: hs.y + o.y };
    const items = [];
    for (const ob of map.objects) {
      const s = toScreen(ob.x, ob.y);
      const sx = Math.round(s.x + o.x), sy = Math.round(s.y + o.y);
      if (sx < -120 || sx > view.w + 120 || sy < -40 || sy > view.h + 240) continue;
      if (ob.type === 'tree') ctx.drawImage(sprites.shadowBig, sx - 17, sy - 6);
      items.push({ depth: ob.depth, ob, sx, sy });
    }
    for (const it of word ? word.left : []) {
      const s = toScreen(it.x, it.y);
      const sx = Math.round(s.x + o.x), sy = Math.round(s.y + o.y);
      if (sx < -40 || sx > view.w + 40 || sy < -20 || sy > view.h + 60) continue;
      ctx.globalAlpha = 0.7 + Math.sin(time * 4 + it.phase) * 0.3;
      ctx.drawImage(sprites.glow, sx - 20, sy - 8);
      ctx.globalAlpha = 1;
      items.push({ depth: it.x + it.y, letter: it, sx, sy });
    }
    ctx.drawImage(sprites.shadowSmall, Math.round(heroPt.x) - 10, Math.round(heroPt.y) - 4);
    items.push({ depth: hero.depth, hero: true });

    // 4. Objects and hero, back to front
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) {
      if (it.hero) { drawHero(hero, heroPt); continue; }
      if (it.letter) {
        const img = getLetterSprite(it.letter.ch, it.letter.color);
        const bob = Math.round(Math.abs(Math.sin(time * 3 + it.letter.phase)) * 6);
        ctx.drawImage(img, it.sx - Math.floor(img.width / 2), it.sy - img.height - 4 - bob);
        continue;
      }
      const spr = it.ob.type === 'tree' ? sprites.trees[it.ob.variant] : it.ob.type === 'rock' ? sprites.rock : sprites.house;
      const x = it.sx - spr.ax, y = it.sy - spr.ay;
      // See-through when the hero walks behind it.
      const behind = it.depth > hero.depth &&
        heroPt.x > x + 4 && heroPt.x < x + spr.img.width - 4 && heroPt.y - 24 > y && heroPt.y - 24 < it.sy;
      ctx.globalAlpha = behind ? 0.45 : 1;
      ctx.drawImage(spr.img, x, y);
      ctx.globalAlpha = 1;
    }

    // 5. Scale up to the screen
    screen.imageSmoothingEnabled = false;
    screen.drawImage(low.c, 0, 0, view.w * view.scale, view.h * view.scale);
  }

  function drawHero(hero, pt) {
    const h = sprites.hero;
    const img = h[hero.facing][hero.frame()];
    const x = Math.round(pt.x - h.w / 2), y = Math.round(pt.y - h.h + 3 - hero.z);
    ctx.drawImage(img, x, y);
    if (hero.clap >= 0) {
      const r = 8 + hero.clap * 30;
      ctx.globalAlpha = 1 - hero.clap;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(Math.round(pt.x), Math.round(pt.y) - 2, r, r / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👏', Math.round(pt.x), y - 4);
      ctx.globalAlpha = 1;
    }
  }

  return { draw, follow, screenToWorld, worldToClient, view };
}
