// Fun photo effects done locally on a <canvas> — no AI, no API key, works offline.

type Effect = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void;

const MAX_SIZE = 900;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Sobel edge strength (0..255) for every pixel. */
const edgeMap = (data: Uint8ClampedArray, w: number, h: number) => {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
  }
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
        gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
        gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      out[i] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }
  return out;
};

const drawEmoji = (ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number, rot = 0) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
};

const comicText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15);
  ctx.font = `900 ${size}px "Comic Sans MS","Chalkboard SE","Fredoka",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size / 6;
  ctx.strokeStyle = '#000';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
};

/** Remap pixels: for each output pixel, fn returns the source coordinate. */
const warp = (ctx: CanvasRenderingContext2D, w: number, h: number, fn: (x: number, y: number) => [number, number]) => {
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let [sx, sy] = fn(x, y);
      sx = Math.max(0, Math.min(w - 1, Math.round(sx)));
      sy = Math.max(0, Math.min(h - 1, Math.round(sy)));
      const si = (sy * w + sx) * 4;
      const di = (y * w + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);
};

const EFFECTS: Record<string, Effect> = {
  blocky: (ctx, img, w, h) => {
    const block = Math.max(8, Math.round(Math.min(w, h) / 36));
    const sw = Math.ceil(w / block), sh = Math.ceil(h / block);
    const tmp = document.createElement('canvas');
    tmp.width = sw; tmp.height = sh;
    tmp.getContext('2d')!.drawImage(img, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, sw * block, sh * block);
    // grid lines so it looks like little blocks
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += block) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += block) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
  },

  comic: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    const edges = edgeMap(d, w, h);
    const step = 255 / 3;
    for (let i = 0; i < w * h; i++) {
      for (let c = 0; c < 3; c++) {
        // boost saturation a bit, then posterize to flat comic colors
        const v = d[i * 4 + c];
        d[i * 4 + c] = clamp(Math.round(clamp((v - 128) * 1.4 + 128) / step) * step);
      }
      if (edges[i] > 90) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; }
    }
    ctx.putImageData(id, 0, 0);
    // halftone dots
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const gap = Math.max(6, Math.round(w / 90));
    for (let y = 0; y < h; y += gap) for (let x = (y / gap) % 2 ? gap / 2 : 0; x < w; x += gap) {
      ctx.beginPath(); ctx.arc(x, y, gap / 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineWidth = Math.max(6, w / 80); ctx.strokeStyle = '#000'; ctx.strokeRect(0, 0, w, h);
    comicText(ctx, pick(['KAPOW!', 'BAM!', 'ZAP!', 'WOW!', 'POW!']), w * 0.74, h * 0.14, Math.min(w, h) / 7, '#facc15');
  },

  doodle: (ctx, img, w, h) => {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const t = tmp.getContext('2d')!;
    t.drawImage(img, 0, 0, w, h);
    const edges = edgeMap(t.getImageData(0, 0, w, h).data, w, h);
    // notebook paper
    ctx.fillStyle = '#fffdf3'; ctx.fillRect(0, 0, w, h);
    const line = Math.max(22, Math.round(h / 24));
    ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 2;
    for (let y = line * 2; y < h; y += line) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#fca5a5'; ctx.beginPath(); ctx.moveTo(w * 0.09, 0); ctx.lineTo(w * 0.09, h); ctx.stroke();
    // blue pen lines
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < w * h; i++) {
      const a = Math.min(1, Math.max(0, (edges[i] - 40) / 120));
      if (a > 0) {
        d[i * 4] = d[i * 4] * (1 - a) + 30 * a;
        d[i * 4 + 1] = d[i * 4 + 1] * (1 - a) + 64 * a;
        d[i * 4 + 2] = d[i * 4 + 2] * (1 - a) + 175 * a;
      }
    }
    ctx.putImageData(id, 0, 0);
    ctx.fillStyle = '#1e40af';
    ctx.font = `${Math.round(Math.min(w, h) / 12)}px sans-serif`;
    for (let k = 0; k < 7; k++) {
      ctx.fillText(pick(['★', '♥', '☆', '♡', '✿']), rand(0.03, 0.9) * w, pick([rand(0.05, 0.18), rand(0.85, 0.97)]) * h);
    }
  },

  glitch: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const src = ctx.getImageData(0, 0, w, h);
    const out = ctx.createImageData(w, h);
    const shift = Math.round(w / 60);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = (y * w + Math.min(w - 1, x + shift)) * 4;
        const b = (y * w + Math.max(0, x - shift)) * 4;
        out.data[i] = clamp((src.data[r] - 128) * 1.3 + 128 + 20);
        out.data[i + 1] = clamp((src.data[i + 1] - 128) * 1.3 + 128);
        out.data[i + 2] = clamp((src.data[b + 2] - 128) * 1.3 + 128 + 40);
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    // random sliding slices
    for (let k = 0; k < 9; k++) {
      const sy = Math.floor(rand(0, h)), sh = Math.floor(rand(4, h / 14)), dx = Math.floor(rand(-w / 10, w / 10));
      const slice = ctx.getImageData(0, sy, w, sh);
      ctx.putImageData(slice, dx, sy);
    }
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  },

  bubble: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const cx = w / 2, cy = h * 0.45, R = Math.min(w, h) * 0.5;
    warp(ctx, w, h, (x, y) => {
      const dx = x - cx, dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy) / R;
      if (r >= 1) return [x, y];
      const k = Math.pow(r, 1.7) / (r || 1);
      return [cx + dx * k, cy + dy * k];
    });
  },

  swirl: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.55;
    warp(ctx, w, h, (x, y) => {
      const dx = x - cx, dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy) / R;
      if (r >= 1) return [x, y];
      const a = Math.atan2(dy, dx) + 3 * Math.pow(1 - r, 2);
      const dist = r * R;
      return [cx + Math.cos(a) * dist, cy + Math.sin(a) * dist];
    });
  },

  mirror: (ctx, img, w, h) => {
    const half = w / 2;
    ctx.drawImage(img, 0, 0, img.width / 2, img.height, 0, 0, half, h);
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, img.width / 2, img.height, 0, 0, half, h);
    ctx.restore();
  },

  rainbow: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    const stops = [[148, 0, 211], [59, 130, 246], [34, 197, 94], [250, 204, 21], [249, 115, 22], [239, 68, 68]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
      const raw = (lum + x / w * 0.35) % 2;
      const t = raw > 1 ? 2 - raw : raw; // ping-pong, so the colours never jump
      const p = t * (stops.length - 1);
      const a = stops[Math.floor(p)], b = stops[Math.min(stops.length - 1, Math.floor(p) + 1)];
      const f = p - Math.floor(p);
      for (let c = 0; c < 3; c++) {
        const col = a[c] + (b[c] - a[c]) * f;
        d[i + c] = clamp(col * 0.75 + d[i + c] * 0.25 * (0.6 + lum));
      }
    }
    ctx.putImageData(id, 0, 0);
  },

  party: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    const colors = ['#f43f5e', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#fb923c'];
    for (let k = 0; k < 120; k++) {
      ctx.save();
      ctx.translate(rand(0, w), pick([rand(0, h * 0.3), rand(0, h)]));
      ctx.rotate(rand(0, Math.PI));
      ctx.fillStyle = pick(colors);
      ctx.fillRect(-4, -8, 8, 16);
      ctx.restore();
    }
    const s = Math.min(w, h);
    drawEmoji(ctx, '🥳', w * 0.13, h * 0.13, s / 6, -0.2);
    drawEmoji(ctx, '🎈', w * 0.88, h * 0.18, s / 5, 0.15);
    drawEmoji(ctx, '🎉', w * 0.12, h * 0.86, s / 6, 0.2);
    drawEmoji(ctx, '🎂', w * 0.87, h * 0.85, s / 6, -0.1);
    comicText(ctx, 'PARTY!', w / 2, h * 0.92, s / 9, '#f472b6');
  },

  banana: (ctx, img, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const s = Math.min(w, h);
    for (let k = 0; k < 10; k++) {
      const edge = k % 4;
      const x = edge === 0 ? rand(0.05, 0.15) * w : edge === 1 ? rand(0.85, 0.95) * w : rand(0.1, 0.9) * w;
      const y = edge === 2 ? rand(0.05, 0.14) * h : edge === 3 ? rand(0.86, 0.95) * h : rand(0.1, 0.9) * h;
      drawEmoji(ctx, '🍌', x, y, rand(s / 12, s / 7), rand(-0.8, 0.8));
    }
    comicText(ctx, 'GO BANANAS!', w / 2, h * 0.9, s / 11, '#facc15');
  },
};

const EFFECT_IDS = Object.keys(EFFECTS);

/**
 * Applies a fun effect to a photo and returns a PNG data URL.
 * @param base64Image data:image/... URL from the file input
 * @param styleId one of the FUN_STYLES ids ("random" picks any)
 */
export const generateFunnyImage = async (base64Image: string, styleId: string): Promise<string> => {
  const img = await loadImage(base64Image);
  const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const id = styleId === 'random' || !EFFECTS[styleId] ? pick(EFFECT_IDS) : styleId;
  EFFECTS[id](ctx, img, w, h);
  // short pause so the fun loading screen is visible
  await new Promise(r => setTimeout(r, 900));
  return canvas.toDataURL('image/png');
};
