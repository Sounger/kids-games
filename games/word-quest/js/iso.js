// Isometric projection. World coordinates are in tiles: tile (i, j) covers [i, i+1) × [j, j+1).
// +x goes down-right on screen, +y goes down-left.

export const TW = 64; // tile width in art pixels
export const TH = 32; // tile height in art pixels

export const toScreen = (x, y) => ({ x: (x - y) * TW / 2, y: (x + y) * TH / 2 });

export const toWorld = (sx, sy) => ({
  x: (sx / (TW / 2) + sy / (TH / 2)) / 2,
  y: (sy / (TH / 2) - sx / (TW / 2)) / 2,
});
