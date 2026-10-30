// Procedural pixel art: every tile and sprite is drawn by code once at start-up.

import { TW, TH } from './iso.js';
import { PixelBuf, hex, mulberry32, makeCanvas } from './util.js';

// ── Tiles ──────────────────────────────────────────────────────────────
// A 64×32 diamond drawn as standard 2:1 pixel steps, so neighbouring tiles meet without gaps.
function rowSpan(y) {
  const half = y < TH / 2 ? 2 * (y + 1) : 2 * (TH - y);
  return [TW / 2 - half, TW / 2 + half - 1];
}
export function insideTile(x, y) {
  if (y < 0 || y >= TH) return false;
  const [a, b] = rowSpan(y);
  return x >= a && x <= b;
}
// Calls fn(x, y, u, v) for each pixel of the diamond; u, v are 0…1 positions along the tile's two axes.
function tile(fn) {
  const p = new PixelBuf(TW, TH);
  for (let y = 0; y < TH; y++) {
    const [a, b] = rowSpan(y);
    for (let x = a; x <= b; x++) {
      const px = x + 0.5 - TW / 2, py = y + 0.5;
      const u = (px / (TW / 2) + py / (TH / 2)) / 2;
      const v = (py / (TH / 2) - px / (TW / 2)) / 2;
      const col = fn(x, y, u, v);
      if (col) p.set(x, y, col);
    }
  }
  return p;
}
function sprinkle(p, rnd, count, draw) {
  for (let k = 0; k < count; k++) {
    const x = 3 + Math.floor(rnd() * (TW - 6)), y = 2 + Math.floor(rnd() * (TH - 4));
    if (insideTile(x - 2, y) && insideTile(x + 2, y) && insideTile(x, y - 2) && insideTile(x, y + 2)) draw(x, y);
  }
}

function grassTile(seed) {
  const rnd = mulberry32(seed);
  const base = hex('#7bc95b'), alt = hex('#73c155'), light = hex('#8ad468'), blade = hex('#58a845');
  const p = tile(() => { const r = rnd(); return r < 0.06 ? light : r < 0.3 ? alt : base; });
  sprinkle(p, rnd, 8, (x, y) => { p.set(x, y, blade); p.set(x - 1, y - 1, blade); p.set(x + 1, y - 1, blade); });
  return p.toCanvas();
}

function pathTile(seed) {
  const rnd = mulberry32(seed);
  const base = hex('#ddb57e'), dark = hex('#cba06a'), light = hex('#ecca95'), pebble = hex('#a98458');
  const p = tile(() => { const r = rnd(); return r < 0.08 ? dark : r < 0.14 ? light : base; });
  sprinkle(p, rnd, 4, (x, y) => { p.set(x, y, pebble); p.set(x + 1, y, pebble); });
  return p.toCanvas();
}

function sandTile(seed) {
  const rnd = mulberry32(seed);
  const base = hex('#f0daa2'), dark = hex('#e2c785'), light = hex('#f9ecc6');
  return tile(() => { const r = rnd(); return r < 0.1 ? dark : r < 0.15 ? light : base; }).toCanvas();
}

function waterTile(frame) {
  const deep = hex('#3a8ddf'), mid = hex('#4fa2ec'), foam = hex('#c4e6ff');
  return tile((x, y, u, v) => {
    const w = Math.sin((u * 2 + frame / 4) * Math.PI * 2 + Math.sin(v * Math.PI * 2) * 0.8);
    if (w > 0.93 && (x + y) % 2 === 0) return foam;
    return w > 0.35 ? mid : deep;
  }).toCanvas();
}

function bridgeTile() {
  const a = hex('#c98b4a'), b = hex('#b97a3c'), gap = hex('#7a4a22'), rail = hex('#8b5a2b'), post = hex('#5e3a1a');
  return tile((x, y, u, v) => {
    const k = Math.floor(v * 6), f = v * 6 - k;
    if (u < 0.1 || u > 0.9) return k % 3 === 0 && f < 0.35 ? post : rail;
    if (f < 0.14) return gap;
    return k % 2 ? a : b;
  }).toCanvas();
}

function flowerOverlay(seed) {
  const rnd = mulberry32(seed);
  const petals = ['#ffffff', '#ff8fab', '#ffd23f', '#c084fc', '#ff6b6b'].map(hex);
  const p = new PixelBuf(TW, TH);
  const stem = hex('#3f8f35');
  sprinkle(p, rnd, 6, (x, y) => {
    const col = petals[Math.floor(rnd() * petals.length)];
    p.set(x, y + 2, stem);
    p.set(x - 1, y, col); p.set(x + 1, y, col); p.set(x, y - 1, col); p.set(x, y + 1, col);
    p.set(x, y, hex('#f59e0b'));
  });
  return p.toCanvas();
}

// ── Objects ────────────────────────────────────────────────────────────
// Each object sprite has an "anchor": the pixel that stands on the tile centre.

function roundTree(seed) {
  const rnd = mulberry32(seed);
  const p = new PixelBuf(48, 72);
  p.rect(20, 44, 8, 22, hex('#8b5a2b'));
  p.rect(25, 44, 3, 22, hex('#6b4220'));
  const blobs = [[24, 30, 15], [13, 37, 10], [35, 37, 10], [24, 17, 11], [14, 25, 9], [34, 25, 9]]
    .map(([x, y, r]) => [x + Math.round(rnd() * 2 - 1), y + Math.round(rnd() * 2 - 1), r]);
  const dark = hex('#2f8a43'), base = hex('#45a852'), light = hex('#74cc6a');
  blobs.forEach(([x, y, r]) => p.circle(x, y, r, dark));
  blobs.forEach(([x, y, r]) => p.circle(x - 1, y - 2, r - 3, base));
  blobs.forEach(([x, y, r]) => p.circle(x - 4, y - 5, Math.max(2, r / 3), light));
  p.outline(hex('#1d4d2a'));
  return { img: p.toCanvas(), ax: 24, ay: 65 };
}

function pineTree() {
  const p = new PixelBuf(44, 76);
  p.rect(19, 56, 7, 12, hex('#7a4a22'));
  p.rect(23, 56, 3, 12, hex('#5e3a1a'));
  const dark = hex('#2a7a52'), light = hex('#3fa06a'), tip = hex('#6fcf8f');
  for (let L = 0; L < 4; L++) {
    const top = 4 + L * 12, h = 20, maxHalf = 8 + L * 4;
    for (let r = 0; r < h; r++) {
      const half = Math.round(1 + (r / h) * maxHalf);
      for (let x = 22 - half; x < 22 + half; x++) p.set(x, top + r, x < 22 - half / 3 ? light : dark);
    }
    p.set(21, top + 1, tip); p.set(22, top + 1, tip);
  }
  p.outline(hex('#174a33'));
  return { img: p.toCanvas(), ax: 22, ay: 67 };
}

function rock() {
  const p = new PixelBuf(30, 22);
  p.ellipse(15, 13, 12, 8, hex('#7d8792'));
  p.ellipse(14, 11, 10, 6, hex('#a7b0ba'));
  p.ellipse(11, 9, 4, 2, hex('#d4dae0'));
  p.outline(hex('#3f4752'));
  return { img: p.toCanvas(), ax: 15, ay: 18 };
}

// The cottage covers 3×3 tiles. Drawn with shapes, then cleaned up to hard pixels.
function house() {
  const W = 200, H = 220;
  const { c, ctx } = makeCanvas(W, H);
  const by = H - 100;                                  // y of the footprint's top corner
  const C = { x: 100, y: by + 48 };                    // footprint centre
  const corner = (x, y, k, lift = 0) => ({ x: C.x + (x - C.x) * k, y: C.y + (y - C.y) * k - lift });
  const T = [100, by], R = [196, by + 48], B = [100, by + 96], L = [4, by + 48];
  const wallH = 44, roofH = 62;
  const w = pt => corner(pt[0], pt[1], 0.78);
  const up = (pt, h) => ({ x: pt.x, y: pt.y - h });
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill(); };

  const Lw = w(L), Bw = w(B), Rw = w(R);
  poly([Lw, Bw, up(Bw, wallH), up(Lw, wallH)], '#fde7c3');  // left wall (door side)
  poly([Bw, Rw, up(Rw, wallH), up(Bw, wallH)], '#e6c492');  // right wall (windows)
  // A point on a wall: t along the bottom edge, h up from the ground.
  const onWall = (a, b, t, h) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - h });
  const panel = (a, b, t0, t1, h0, h1, col) => poly([onWall(a, b, t0, h0), onWall(a, b, t1, h0), onWall(a, b, t1, h1), onWall(a, b, t0, h1)], col);
  panel(Lw, Bw, 0.40, 0.64, 0, 30, '#6b4220');
  panel(Lw, Bw, 0.43, 0.61, 0, 27, '#9a6232');
  panel(Lw, Bw, 0.12, 0.28, 14, 30, '#ffffff');
  panel(Lw, Bw, 0.14, 0.26, 16, 28, '#7dd3fc');
  [[0.18, 0.40], [0.60, 0.82]].forEach(([t0, t1]) => {
    panel(Bw, Rw, t0, t1, 14, 32, '#ffffff');
    panel(Bw, Rw, t0 + 0.02, t1 - 0.02, 16, 30, '#7dd3fc');
  });
  // Roof: a low pyramid with eaves.
  const e = pt => corner(pt[0], pt[1], 0.92, wallH);
  const Te = e(T), Re = e(R), Be = e(B), Le = e(L);
  const apex = { x: C.x, y: C.y - wallH - roofH };
  poly([Le, Te, apex], '#b4371f');
  poly([Te, Re, apex], '#b4371f');
  poly([Le, Be, apex], '#ef6b4f');
  poly([Be, Re, apex], '#c84a2c');
  // Chimney
  poly([{ x: 128, y: apex.y + 30 }, { x: 140, y: apex.y + 36 }, { x: 140, y: apex.y + 14 }, { x: 128, y: apex.y + 8 }], '#9ca3af');

  const p = new PixelBuf(W, H).fromCanvas(c).outline(hex('#3b2416'));
  return { img: p.toCanvas(), ax: 100, ay: by + 48 };
}

// ── Hero ───────────────────────────────────────────────────────────────
const PAL = {
  k: '#2b2140', h: '#7a4a2a', s: '#f7c9a0', p: '#f59ab0', m: '#c2410c',
  r: '#e94b5b', y: '#ffd23f', b: '#3b6fd8', d: '#5b3a1e',
};
const HEAD_FRONT = [
  '....kkkkkkkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
  '..khhssssssshk..', '..khsssssssshk..', '..kssksssskssk..', '..kssksssskssk..',
  '..kpsssssssspk..', '...ksssmmsssk...', '....kkkkkkkk....',
];
const HEAD_BACK = [
  '....kkkkkkkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..', '...khhhhhhhhk...', '....kkkkkkkk....',
];
const BODY_FRONT = ['...krrrrrrrrk...', '..ksrrrrrrrrsk..', '..ksrrryyrrrsk..', '..kskrrrrrrksk..', '...kkbbbbbbkk...', '....kbbbbbbk....'];
const BODY_BACK = ['...krrrrrrrrk...', '..ksrrrrrrrrsk..', '..ksrrrrrrrrsk..', '..kskrrrrrrksk..', '...kkbbbbbbkk...', '....kbbbbbbk....'];
const LEGS = {
  stand: ['....kbbkkbbk....', '....kbbkkbbk....', '....kddkkddk....', '....kkkkkkkk....', '................'],
  walkA: ['....kbbkkbbk....', '...kbbk..kbbk...', '...kddk..kbbk...', '...kkkk..kddk...', '.........kkkk...'],
  walkB: ['....kbbkkbbk....', '...kbbk..kbbk...', '...kbbk..kddk...', '...kddk..kkkk...', '...kkkk.........'],
};
const HERO_SCALE = 2;

function heroFrame(rows) {
  const p = new PixelBuf(16 * HERO_SCALE, rows.length * HERO_SCALE);
  rows.forEach((row, y) => [...row.padEnd(16, '.')].forEach((ch, x) => {
    if (PAL[ch]) p.rect(x * HERO_SCALE, y * HERO_SCALE, HERO_SCALE, HERO_SCALE, hex(PAL[ch]));
  }));
  return p.toCanvas();
}

function heroSprites() {
  const make = (head, body) => ({
    stand: heroFrame([...head, ...body, ...LEGS.stand]),
    walkA: heroFrame([...head, ...body, ...LEGS.walkA]),
    walkB: heroFrame([...head, ...body, ...LEGS.walkB]),
  });
  return { front: make(HEAD_FRONT, BODY_FRONT), back: make(HEAD_BACK, BODY_BACK), w: 16 * HERO_SCALE, h: 22 * HERO_SCALE };
}

// ── Letters ────────────────────────────────────────────────────────────
// 5×7 block font, drawn big with a 3D side so letters read well from the back of the class.
const FONT = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
};
export const LETTER_COLORS = [
  ['#ff5a5f', '#b3262b', '#ffb3b5'], ['#ff9f1c', '#b35f00', '#ffd59a'], ['#ffd23f', '#b38a00', '#fff1a8'],
  ['#3ddc84', '#16834a', '#b2f5cf'], ['#4dabf7', '#1c5f9e', '#bfe3ff'], ['#b57cf6', '#6a35b0', '#e3cdff'],
];
const GREY = ['#cdbcbc', '#8f7272', '#ece0e0'];   // a decoy letter that bounced off
const LETTER_PX = 5, DEPTH = 5;

function letterSprite(ch, colorIdx) {
  const rows = (FONT[ch] || FONT.A).split(' ');
  const [face, side, hi] = (colorIdx < 0 ? GREY : LETTER_COLORS[colorIdx % LETTER_COLORS.length]).map(hex);
  const w = 5 * LETTER_PX + DEPTH + 2, h = 7 * LETTER_PX + DEPTH + 2;
  const p = new PixelBuf(w, h);
  const on = (x, y) => rows[y]?.[x] === '1';
  // Side (extrusion), then face on top, then a light top edge on each block.
  for (let d = DEPTH; d >= 1; d--) {
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '1') p.rect(1 + x * LETTER_PX + d, 1 + y * LETTER_PX + d, LETTER_PX, LETTER_PX, side); }));
  }
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '1') return;
    p.rect(1 + x * LETTER_PX, 1 + y * LETTER_PX, LETTER_PX, LETTER_PX, face);
    if (!on(x, y - 1)) p.rect(1 + x * LETTER_PX, 1 + y * LETTER_PX, LETTER_PX, 1, hi);
  }));
  p.outline(hex('#2b2140'));
  return p.toCanvas();
}

const letterCache = new Map();
export function getLetterSprite(ch, colorIdx) {
  const key = ch + colorIdx;
  if (!letterCache.has(key)) letterCache.set(key, letterSprite(ch, colorIdx));
  return letterCache.get(key);
}

// Treasure chest, closed and open. Drawn on a 20×17 grid, every cell 2×2 pixels.
function chest(open) {
  const p = new PixelBuf(40, 34);
  const r = (x, y, w, h, col) => p.rect(x * 2, y * 2, w * 2, h * 2, hex(col));
  const gold = '#f5c542', goldDark = '#b8860b';
  if (open) {
    r(1, 0, 18, 5, '#6b3a1e');           // lid, swung back (we see its inside)
    r(3, 0, 2, 5, goldDark); r(15, 0, 2, 5, goldDark);
    r(2, 5, 16, 3, '#fff3a0');           // shining treasure inside
    r(5, 5, 2, 1, '#ffffff'); r(12, 6, 2, 1, '#ffffff');
  } else {
    r(1, 2, 18, 6, '#c0703a');           // lid
    r(2, 2, 16, 1, '#e09455');
    r(3, 2, 2, 6, gold); r(15, 2, 2, 6, gold);
  }
  r(1, 8, 18, 8, '#a0522d');             // body
  r(1, 8, 18, 1, '#7a3d1e');
  r(1, 14, 18, 2, '#7a3d1e');
  r(3, 8, 2, 8, gold); r(15, 8, 2, 8, gold);
  if (!open) { r(8, 6, 4, 5, gold); r(9, 8, 2, 2, '#3b2416'); r(8, 6, 4, 1, '#fff1a8'); }
  p.outline(hex('#2b2140'));
  return { img: p.toCanvas(), ax: 20, ay: 32 };
}

// A little white cloud for the "poof".
function puff() {
  const p = new PixelBuf(40, 28);
  const white = hex('#ffffff'), shade = hex('#dfe6ee');
  [[12, 16, 8], [22, 12, 10], [30, 17, 7], [20, 19, 8]].forEach(([x, y, r]) => p.circle(x, y, r, shade));
  [[11, 14, 7], [21, 10, 9], [29, 15, 6], [19, 17, 7]].forEach(([x, y, r]) => p.circle(x, y, r, white));
  p.outline(hex('#9aa6b5'));
  return p.toCanvas();
}

function glow() {
  const p = new PixelBuf(40, 16);
  p.ellipse(20, 8, 19, 7, [255, 240, 150], 70);
  p.ellipse(20, 8, 12, 4, [255, 250, 200], 110);
  return p.toCanvas();
}

function shadow(rx, ry) {
  const p = new PixelBuf(rx * 2 + 2, ry * 2 + 2);
  p.ellipse(rx + 1, ry + 1, rx, ry, [20, 40, 20], 70);
  return p.toCanvas();
}

export function buildSprites() {
  return {
    grass: [1, 2, 3, 4].map(grassTile),
    path: [11, 12, 13].map(pathTile),
    sand: [21, 22].map(sandTile),
    water: [0, 1, 2, 3].map(waterTile),
    bridge: bridgeTile(),
    flowers: [31, 32, 33, 34].map(flowerOverlay),
    trees: [roundTree(41), roundTree(42), pineTree()],
    rock: rock(),
    house: house(),
    hero: heroSprites(),
    shadowBig: shadow(16, 6),
    shadowSmall: shadow(9, 4),
    glow: glow(),
    puff: puff(),
    chestClosed: chest(false),
    chestOpen: chest(true),
  };
}
