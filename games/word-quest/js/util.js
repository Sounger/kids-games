// Small helpers: seeded random numbers and a pixel buffer for drawing crisp sprites.

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));

export function shuffle(rnd, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

// RGBA pixel buffer. Everything is drawn pixel by pixel, so there is no blur or anti-aliasing.
export class PixelBuf {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  set(x, y, col, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = col[0]; this.data[i + 1] = col[1]; this.data[i + 2] = col[2]; this.data[i + 3] = a;
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  rect(x, y, w, h, col, a) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, col, a);
  }
  ellipse(cx, cy, rx, ry, col, a) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, col, a);
      }
    }
  }
  circle(cx, cy, r, col, a) { this.ellipse(cx, cy, r, r, col, a); }
  // Paints a 1-pixel outline around everything that is drawn.
  outline(col) {
    const solid = new Uint8Array(this.w * this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) solid[y * this.w + x] = this.alpha(x, y) > 0 ? 1 : 0;
    const at = (x, y) => x >= 0 && y >= 0 && x < this.w && y < this.h && solid[y * this.w + x];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (solid[y * this.w + x]) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.set(x, y, col);
      }
    }
    return this;
  }
  // Copies a canvas drawn with normal (blurry) paths and keeps only solid pixels.
  fromCanvas(c) {
    const img = c.getContext('2d').getImageData(0, 0, this.w, this.h).data;
    for (let i = 0; i < img.length; i += 4) {
      if (img[i + 3] >= 128) {
        this.data[i] = img[i]; this.data[i + 1] = img[i + 1]; this.data[i + 2] = img[i + 2]; this.data[i + 3] = 255;
      }
    }
    return this;
  }
  toCanvas() {
    const { c, ctx } = makeCanvas(this.w, this.h);
    ctx.putImageData(new ImageData(this.data, this.w, this.h), 0, 0);
    return c;
  }
}
