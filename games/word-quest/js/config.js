// All default settings in one place. The teacher menu (settings.js / teacher.js) saves changes
// on top of these in the browser.

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
  // Word sets the game starts with. The teacher can change them all in the teacher menu.
  wordSets: [
    { name: 'Mix', words: [
      { word: 'APPLE', pic: '🍎' }, { word: 'CAT', pic: '🐱' }, { word: 'SUN', pic: '☀️' },
      { word: 'FISH', pic: '🐟' }, { word: 'BALL', pic: '⚽' }, { word: 'FROG', pic: '🐸' },
      { word: 'STAR', pic: '⭐' }, { word: 'CAKE', pic: '🎂' }, { word: 'MOON', pic: '🌙' },
      { word: 'TRAIN', pic: '🚂' },
    ] },
    { name: 'Fruits', words: [
      { word: 'APPLE', pic: '🍎' }, { word: 'PEAR', pic: '🍐' }, { word: 'LEMON', pic: '🍋' },
      { word: 'GRAPES', pic: '🍇' }, { word: 'MANGO', pic: '🥭' }, { word: 'KIWI', pic: '🥝' },
      { word: 'MELON', pic: '🍈' }, { word: 'PEACH', pic: '🍑' }, { word: 'BANANA', pic: '🍌' },
    ] },
    { name: 'Animals', words: [
      { word: 'CAT', pic: '🐱' }, { word: 'DOG', pic: '🐶' }, { word: 'FISH', pic: '🐟' },
      { word: 'FROG', pic: '🐸' }, { word: 'LION', pic: '🦁' }, { word: 'DUCK', pic: '🦆' },
      { word: 'BEAR', pic: '🐻' }, { word: 'PIG', pic: '🐷' }, { word: 'COW', pic: '🐮' },
    ] },
    { name: 'Colors', words: [
      { word: 'RED', pic: '🔴' }, { word: 'BLUE', pic: '🔵' }, { word: 'GREEN', pic: '🟢' },
      { word: 'YELLOW', pic: '🟡' }, { word: 'ORANGE', pic: '🟠' }, { word: 'PURPLE', pic: '🟣' },
      { word: 'BROWN', pic: '🟤' }, { word: 'BLACK', pic: '⚫' }, { word: 'WHITE', pic: '⚪' },
    ] },
  ],
  play: {
    order: 'order',      // which word comes next: 'order', 'random' or 'manual' (picked on a screen before each game)
    replay: 'next',      // A on the victory screen: 'next' word or the 'same' word again
  },
  mobs: { enabled: true },   // stage 7
  cave: { enabled: true },   // stage 10
  weather: { enabled: true },  // now and then light rain or evening light instead of a sunny day
  letters: {
    minFromStart: 5,     // tiles: no letter right next to where the hero starts
    spread: 5,           // tiles: letters keep at least this far apart (relaxed if the map is too small)
    pickupRadius: 0.6,   // tiles: walking this close picks the letter up by itself
    reachA: 1.4,         // tiles: pressing A picks up a letter this close
  },
  decoys: {
    enabled: true,
    count: 3,            // letters that are NOT in the word, lying on the map like the real ones
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
    music: 0.5,          // background music, always quieter than the voice
  },
  // To use your own recording for a track, put the file in the game folder and name it here,
  // e.g. overworld: 'music/overworld.ogg'. null = the built-in 8-bit music.
  musicFiles: { title: null, overworld: null, cave: null, victory: null, chest: null },
  controls: {
    // 'iso'    — each D-pad direction walks along the map grid (screen diagonals), as in the spec.
    // 'screen' — up walks up on the screen, right walks right, etc.
    dpad: 'iso',
    swapAB: false,       // if the gamepad reports A and B the other way round
    repeatGuardMs: 120,  // ignore a second press of the same button faster than this
  },
};
