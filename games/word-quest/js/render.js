// Draws the world into a small "art pixel" canvas, then scales it up by a whole number
// onto the screen canvas, so pixels stay sharp on the projector.

import { TW, TH, toScreen, toWorld } from './iso.js';
import { GRASS, PATH, SAND, WATER, BRIDGE, CAVE } from './map.js';
import { makeCanvas } from './util.js';
import { getLetterSprite } from './sprites.js';

export function createRenderer(canvas, sprites, viewCfg) {
  const screen = canvas.getContext('2d');
  const low = makeCanvas(viewCfg.baseWidth, viewCfg.baseHeight);
  const dark = makeCanvas(viewCfg.baseWidth, viewCfg.baseHeight);   // the cave's darkness, with holes of light
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
    dark.c.width = view.w; dark.c.height = view.h;
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

  // extra: { life, owl, hint } — living-map details, the owl, and the owl's arrow target.
  function draw(map, hero, time, word, mobs = [], extra = {}) {
    const { life, owl, hint, cave } = extra;
    const blooms = new Map((life?.blooms || []).filter(b => b.t < 0.6).map(b => [map.idx(b.i, b.j), b.t / 0.6]));
    const o = offset();
    ctx.fillStyle = map.bg || '#245a32';
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
        else if (g === CAVE) img = sprites.caveFloor[hsh % sprites.caveFloor.length];
        if (!img) continue;
        ctx.drawImage(img, x, y);
        if (inMap && map.flowers[k] >= 0) {
          const grow = blooms.get(k);
          if (grow === undefined) ctx.drawImage(sprites.flowers[map.flowers[k]], x, y);
          else {
            const g = Math.min(1, grow * 1.3), w = Math.round(TW * g), h = Math.round(TH * g);
            ctx.drawImage(sprites.flowers[map.flowers[k]], x + (TW - w) / 2, y + (TH - h) / 2, w, h);
          }
        }
      }
    }

    // Grass swaying in the wind.
    for (const t of map.tufts) {
      const s = toScreen(t.i, t.j);
      const x = Math.round(s.x + o.x + t.ox), y = Math.round(s.y + o.y + t.oy);
      if (x < -10 || x > view.w || y < -10 || y > view.h + 10) continue;
      const w = Math.sin(time * 1.8 + t.phase + t.i * 0.3);
      ctx.drawImage(sprites.tuft[w < -0.35 ? 0 : w > 0.35 ? 2 : 1], x - 5, y - 6);
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
    for (const ch of word ? word.chests : []) {
      const s = toScreen(ch.x, ch.y);
      const sx = Math.round(s.x + o.x), sy = Math.round(s.y + o.y);
      if (sx < -40 || sx > view.w + 40 || sy < -20 || sy > view.h + 60) continue;
      if (!ch.open) {
        ctx.globalAlpha = 0.6 + Math.sin(time * 3 + ch.x) * 0.3;
        ctx.drawImage(sprites.glow, sx - 20, sy - 8);
        ctx.globalAlpha = 1;
      }
      items.push({ depth: ch.x + ch.y, chest: ch, sx, sy });
    }
    for (const it of word ? word.rejected : []) {
      const s = toScreen(it.x, it.y);
      items.push({ depth: it.x + it.y + 0.5, rejected: it, sx: Math.round(s.x + o.x), sy: Math.round(s.y + o.y) });
    }
    for (const m of mobs) {
      const s = toScreen(m.x, m.y);
      const sx = Math.round(s.x + o.x), sy = Math.round(s.y + o.y);
      if (sx < -60 || sx > view.w + 60 || sy < -60 || sy > view.h + 60) continue;
      ctx.globalAlpha = m.type === 'bee' ? 0.5 : 1;
      ctx.drawImage(sprites.shadowSmall, sx - 10, sy - 4);
      ctx.globalAlpha = 1;
      items.push({ depth: m.x + m.y + (m.type === 'bee' ? 1 : 0), mob: m, sx, sy });
    }
    for (const c of cave ? cave.crystals : []) {
      if (c.got) continue;
      const s = toScreen(c.x, c.y);
      items.push({ depth: c.x + c.y, crystal: c, sx: Math.round(s.x + o.x), sy: Math.round(s.y + o.y) });
    }
    ctx.drawImage(sprites.shadowSmall, Math.round(heroPt.x) - 10, Math.round(heroPt.y) - 4);
    items.push({ depth: hero.depth, hero: true });
    if (owl) {
      const s = toScreen(owl.x, owl.y);
      items.push({ depth: owl.x + owl.y, owl, sx: Math.round(s.x + o.x), sy: Math.round(s.y + o.y) });
    }

    // 4. Objects and hero, back to front
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) {
      if (it.hero) { drawHero(hero, heroPt); continue; }
      if (it.chest) {
        const spr = it.chest.open ? sprites.chestOpen : sprites.chestClosed;
        const shake = it.chest.shakeT >= 0 ? Math.round(Math.sin(it.chest.shakeT * 50) * 3) : 0;
        ctx.drawImage(spr.img, it.sx - spr.ax + shake, it.sy - spr.ay + 4);
        continue;
      }
      if (it.mob) { drawMob(it.mob, it.sx, it.sy, time); continue; }
      if (it.crystal) {
        const img = sprites.crystal, bob = Math.round(Math.sin(it.crystal.phase * 3) * 3);
        ctx.drawImage(img, it.sx - img.width / 2, it.sy - img.height - 6 + bob);
        continue;
      }
      if (it.owl) {
        const img = (time % 3.2) < 0.15 ? sprites.owl.blink : sprites.owl.open;
        const tilt = it.owl.talkT > 0 ? Math.round(Math.sin(time * 10) * 2) : 0;
        ctx.drawImage(img, it.sx - img.width / 2 + tilt, it.sy - img.height + 6);
        continue;
      }
      if (it.rejected) { drawRejected(it.rejected, it.sx, it.sy); continue; }
      if (it.letter) {
        const img = getLetterSprite(it.letter.ch, it.letter.color);
        const bob = Math.round(Math.abs(Math.sin(time * 3 + it.letter.phase)) * 6);
        ctx.drawImage(img, it.sx - Math.floor(img.width / 2), it.sy - img.height - 4 - bob);
        continue;
      }
      const t = it.ob.type;
      const spr = t === 'tree' ? sprites.trees[it.ob.variant] : t === 'rock' ? sprites.rock : t === 'wall' ? sprites.caveWall[it.ob.variant]
        : t === 'ladder' ? sprites.ladder : t === 'mushroom' ? sprites.mushrooms[it.ob.variant] : t === 'hatch' ? sprites.hatch : sprites.house;
      const x = it.sx - spr.ax, y = it.sy - spr.ay;
      // See-through when the hero walks behind it.
      const behind = it.depth > hero.depth &&
        heroPt.x > x + 4 && heroPt.x < x + spr.img.width - 4 && heroPt.y - 24 > y && heroPt.y - 24 < it.sy;
      ctx.globalAlpha = behind ? 0.45 : 1;
      ctx.drawImage(spr.img, x, y);
      ctx.globalAlpha = 1;
    }

    if (cave) drawDark(cave, hero, o, time);
    if (life) drawLife(life, o, time);
    if (hint) drawArrow(heroPt, hint, o, time, hero.z);

    // 5. Scale up to the screen
    screen.imageSmoothingEnabled = false;
    screen.drawImage(low.c, 0, 0, view.w * view.scale, view.h * view.scale);
  }

  // A decoy the hero touched: shakes and turns grey, bounces away, then goes "poof".
  function drawRejected(it, sx, sy) {
    const t = it.rejectT;
    const img = getLetterSprite(it.ch, -1);
    let x = sx - Math.floor(img.width / 2), y = sy - img.height - 4;
    if (t < 0.35) {
      x += Math.round(Math.sin(t * 70) * 3);
      ctx.drawImage(t < 0.1 ? getLetterSprite(it.ch, it.color) : img, x, y);
      return;
    }
    const k = Math.min(1, (t - 0.35) / 0.45);           // bounce away
    x += Math.round(it.awayX * 40 * k);
    y += Math.round(-Math.sin(k * Math.PI) * 30 + it.awayY * 20 * k);
    if (k < 1) { ctx.globalAlpha = 1 - k * 0.5; ctx.drawImage(img, x, y); }
    if (t > 0.7) {                                      // poof
      const p = Math.min(1, (t - 0.7) / 0.4);
      ctx.globalAlpha = 1 - p;
      const w = Math.round(40 * (0.6 + p * 0.6)), h = Math.round(28 * (0.6 + p * 0.6));
      ctx.drawImage(sprites.puff, x + img.width / 2 - w / 2, y + img.height / 2 - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  function drawLife(life, o, time) {
    // Cloud shadows drift over everything.
    ctx.fillStyle = 'rgba(20, 40, 30, 0.13)';
    for (const c of life.clouds) {
      const s = toScreen(c.x, c.y);
      ctx.beginPath();
      ctx.ellipse(s.x + o.x, s.y + o.y, c.r * TW / 2, c.r * TH / 2, 0, 0, Math.PI * 2);
      ctx.ellipse(s.x + o.x + c.r * 18, s.y + o.y - c.r * 4, c.r * TW / 3, c.r * TH / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of life.butterflies) {
      const s = toScreen(b.x, b.y);
      const img = sprites.butterflies[b.color][Math.floor(time * 8 + b.phase) % 2];
      ctx.drawImage(img, Math.round(s.x + o.x - img.width / 2), Math.round(s.y + o.y - b.z + Math.sin(b.phase * 4) * 3));
    }
    for (const b of life.birds) {
      const img = sprites.bird[Math.floor(b.flap * 6) % 2];
      ctx.save();
      if (b.vx < 0) { ctx.translate(Math.round(b.x), 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, Math.round(b.y)); }
      else ctx.drawImage(img, Math.round(b.x), Math.round(b.y));
      ctx.restore();
    }
    if (life.weather === 'rain') {
      ctx.fillStyle = 'rgba(40, 60, 100, 0.2)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.fillStyle = 'rgba(200, 225, 255, 0.75)';
      for (const d of life.drops) {
        const x = Math.round(d.x * view.w), y = Math.round(d.y * view.h);
        ctx.fillRect(x, y, 1, 5); ctx.fillRect(x - 1, y + 5, 1, 2);
      }
    } else if (life.weather === 'evening') {
      ctx.fillStyle = 'rgba(255, 130, 60, 0.16)';
      ctx.fillRect(0, 0, view.w, view.h);
      const g = ctx.createLinearGradient(0, 0, 0, view.h);
      g.addColorStop(0, 'rgba(90, 40, 120, 0.22)'); g.addColorStop(0.5, 'rgba(90, 40, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, view.w, view.h);
    }
  }

  // The cave is dark: only a circle of light around the hero, plus whatever glows.
  function drawDark(cave, hero, o, time) {
    const d = dark.ctx;
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, view.w, view.h);
    d.fillStyle = 'rgba(6, 5, 18, 0.88)';
    d.fillRect(0, 0, view.w, view.h);
    d.globalCompositeOperation = 'destination-out';
    for (const l of cave.lights(hero)) {
      const s = toScreen(l.x, l.y);
      const x = s.x + o.x, y = s.y + o.y - l.lift, r = l.r * (1 + Math.sin(time * 3 + l.x) * 0.04);
      const g = d.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g;
      d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill();
    }
    ctx.drawImage(dark.c, 0, 0);
    // Fireflies glow on top of the dark.
    ctx.globalCompositeOperation = 'lighter';
    for (const f of cave.fireflies) {
      const s = toScreen(f.x, f.y);
      const a = 0.5 + Math.sin(f.phase * 4) * 0.4;
      ctx.fillStyle = `rgba(220, 255, 140, ${a})`;
      const x = Math.round(s.x + o.x), y = Math.round(s.y + o.y - f.z);
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = `rgba(180, 255, 120, ${a * 0.35})`;
      ctx.fillRect(x - 1, y - 1, 4, 4);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // The owl's arrow: hovers by the hero and points towards the letter.
  function drawArrow(heroPt, target, o, time, z) {
    const t = toScreen(target.x, target.y);
    const dx = t.x + o.x - heroPt.x, dy = t.y + o.y - heroPt.y, d = Math.hypot(dx, dy);
    if (d < 30) return;
    const ux = dx / d, uy = dy / d, r = 30 + Math.sin(time * 8) * 4;
    const cx = heroPt.x + ux * r, cy = heroPt.y - 16 - z + uy * r;
    const pts = [[14, 0], [0, -9], [0, -4], [-10, -4], [-10, 4], [0, 4], [0, 9]]
      .map(([px, py]) => [Math.round(cx + px * ux - py * uy), Math.round(cy + px * uy + py * ux)]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#2b2140'; ctx.stroke();
  }

  function drawMob(m, sx, sy, time) {
    if (m.type === 'raccoon') {
      const img = sprites.raccoon[Math.floor(m.anim * (m.mode === 'flee' ? 12 : 6)) % 2];
      ctx.drawImage(img, sx - img.width / 2, sy - img.height + 2);
      if (m.mode === 'flee' && m.modeT < 2) emoji('😆', sx + 14, sy - img.height - 2, 14);
    } else if (m.type === 'slime') {
      const img = m.scaredT > 0 ? sprites.slime.scared : sprites.slime.normal;
      const squash = 1 + Math.sin(m.anim * 6) * 0.12;
      const w = Math.round(img.width / squash), h = Math.round(img.height * squash);
      ctx.drawImage(img, sx - Math.floor(w / 2), sy - h + 3, w, h);
      if (m.scaredT > 0) emoji('💦', sx + 12, sy - h - 2, 12);
    } else if (m.type === 'bee') {
      const img = sprites.bee[Math.floor(time * 16) % 2];
      const y = sy - 30 + Math.round(Math.sin(time * 5) * 3);
      ctx.drawImage(img, sx - img.width / 2, y - img.height / 2);
    }
  }
  function emoji(ch, x, y, size) {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ch, Math.round(x), Math.round(y));
  }

  function drawHero(hero, pt) {
    const h = sprites.hero;
    const img = h[hero.facing][hero.frame()];
    const x = Math.round(pt.x - h.w / 2), y = Math.round(pt.y - h.h + 3 - hero.z);
    ctx.drawImage(img, x, y);
    if (hero.dizzy) {
      const a = performance.now() / 150;
      emoji('💫', pt.x + Math.cos(a) * 10, y - 2 + Math.sin(a) * 3, 14);
      emoji('🐝', pt.x - Math.cos(a) * 12, y - 8, 10);
    }
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
