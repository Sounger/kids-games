// All default settings in one place. Later stages add word lists, math, mobs, audio…

export const CONFIG = {
  view: {
    // Size of the game picture in "art pixels". It is scaled up by a whole number
    // (1920×1080 projector → ×3), so pixels stay sharp.
    baseWidth: 640,
    baseHeight: 360,
  },
  map: {
    size: 32,            // tiles per side
    treeDensity: 0.14,
    rockDensity: 0.03,
    flowerDensity: 0.12,
  },
  hero: {
    speed: 3.6,          // tiles per second
    radius: 0.28,        // tiles, for bumping into things
  },
  controls: {
    // 'iso'    — each D-pad direction walks along the map grid (screen diagonals), as in the spec.
    // 'screen' — up walks up on the screen, right walks right, etc.
    dpad: 'iso',
    swapAB: false,       // if the gamepad reports A and B the other way round
    repeatGuardMs: 120,  // ignore a second press of the same button faster than this
  },
};

// Quick overrides for testing: ?move=screen, ?swapab=1
const params = new URLSearchParams(location.search);
if (params.get('move') === 'screen') CONFIG.controls.dpad = 'screen';
if (params.get('swapab') === '1') CONFIG.controls.swapAB = true;
