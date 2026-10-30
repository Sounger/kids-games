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
  // Until the teacher menu (stage 6) these are the words, played in this order.
  words: [
    { word: 'APPLE', pic: '🍎' }, { word: 'CAT', pic: '🐱' }, { word: 'SUN', pic: '☀️' },
    { word: 'FISH', pic: '🐟' }, { word: 'BALL', pic: '⚽' }, { word: 'FROG', pic: '🐸' },
    { word: 'STAR', pic: '⭐' }, { word: 'CAKE', pic: '🎂' }, { word: 'MOON', pic: '🌙' },
    { word: 'TRAIN', pic: '🚂' },
  ],
  letters: {
    minFromStart: 5,     // tiles: no letter right next to where the hero starts
    spread: 5,           // tiles: letters keep at least this far apart (relaxed if the map is too small)
    pickupRadius: 0.6,   // tiles: walking this close picks the letter up by itself
    reachA: 1.4,         // tiles: pressing A picks up a letter this close
  },
  chests: {
    share: 0.45,         // part of the letters locked in chests (at least one letter always lies on the ground)
  },
  math: {
    max: 30,             // all numbers and answers stay within 0…max (10, 20 or 30)
    ops: 'both',         // '+', '-' or 'both'
  },
  voice: {
    rate: 0.85,          // a little slower than normal
    pitch: 1.05,
    volume: 1,
  },
  audio: {
    master: 0.9,
    sfx: 0.6,            // effects stay quieter than the voice
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
