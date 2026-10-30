// The soundtrack, written as note patterns. One token per 16th note:
//   'C5' plays a note, '-' holds the previous note, '.' is a rest.
// Bass, harmony and drums are generated from the chord of each bar.

export const CHORDS = {
  C: ['C', 'E', 'G'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'], Am: ['A', 'C', 'E'],
  Em: ['E', 'G', 'B'], E: ['E', 'G#', 'B'], Dm: ['D', 'F', 'A'],
};

const sections = {
  A: {
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F'],
    melody: [
      'E5 - G5 - C6 - - - G5 - E5 - G5 - - -', 'D5 - G5 - B5 - - - A5 - G5 - D5 - - -',
      'C5 - E5 - A5 - - - G5 - E5 - C5 - - -', 'F5 - E5 - D5 - C5 - D5 - - - . . . .',
      'E5 - G5 - C6 - - - G5 - E5 - G5 - - -', 'D5 - G5 - B5 - - - D6 - C6 - B5 - - -',
      'C6 - B5 - A5 - - - E5 - A5 - C6 - - -', 'A5 - - - F5 - - - G5 - - - - - . .',
    ],
  },
  B: {
    chords: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
    melody: [
      'A4 - C5 - F5 - A5 - G5 - F5 - E5 - F5 -', 'G5 - - - D5 - G5 - B5 - - - A5 - G5 -',
      'E5 - G5 - B5 - - - A5 - G5 - E5 - - -', 'A5 - - - E5 - - - C5 - E5 - A5 - - -',
      'C6 - - - A5 - - - F5 - A5 - C6 - - -', 'B5 - - - G5 - - - D5 - G5 - B5 - - -',
      'C6 - G5 - E5 - G5 - C6 - - - E6 - - -', 'D6 - C6 - - - - - . . . . . . . .',
    ],
  },
  C: {
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
    melody: [
      'A5 - - - - - - - E5 - - - C5 - - -', 'F5 - - - - - - - A5 - - - C6 - - -',
      'G5 - - - - - - - E5 - - - C5 - - -', 'D5 - - - - - - - G5 - - - B5 - - -',
      'A5 - - - C6 - - - E6 - - - C6 - - -', 'A5 - - - - - - - F5 - - - A5 - - -',
      'G5 - - - E5 - - - G5 - - - C6 - - -', 'D6 - - - B5 - - - G5 - - - D5 - - -',
    ],
  },
};

const song = (...names) => ({
  chords: names.flatMap(n => sections[n].chords),
  melody: names.flatMap(n => sections[n].melody),
});

export const TRACKS = {
  // Bouncy loop for the start screen.
  title: {
    bpm: 150, loop: true, drums: 'pop', vol: 0.9,
    chords: ['C', 'F', 'G', 'C'],
    melody: [
      'C5 - E5 - G5 - C6 - G5 - E5 - C5 - G4 -', 'F5 - A5 - C6 - A5 - F5 - - - A5 - - -',
      'G5 - B5 - D6 - B5 - G5 - - - F5 - E5 -', 'C6 - - - G5 - - - C6 - - - . . . .',
    ],
  },
  // Cheerful, not pushy; about 85 seconds before it repeats.
  overworld: { bpm: 132, loop: true, drums: 'pop', vol: 0.75, ...song('A', 'A', 'B', 'C', 'A', 'B') },
  // Mysterious and quiet, with an echo.
  cave: {
    bpm: 90, loop: true, drums: 'soft', vol: 0.6, echo: true,
    chords: ['Am', 'Em', 'F', 'E', 'Am', 'Em', 'F', 'E'],
    melody: [
      'A4 - - - - - - - C5 - - - E5 - - -', 'B4 - - - - - - - G4 - - - - - - -',
      'A4 - - - C5 - - - F5 - - - E5 - - -', 'G#4 - - - - - - - B4 - - - - - - -',
      'E5 - - - - - - - D5 - - - C5 - - -', 'B4 - - - - - - - E5 - - - - - - -',
      'C5 - - - A4 - - - F4 - - - A4 - - -', 'G#4 - - - - - - - - - - - . . . .',
    ],
  },
  // Short jingles, played once.
  victory: {
    bpm: 160, loop: false, drums: 'roll', vol: 1,
    chords: ['C', 'G', 'C'],
    melody: ['C5 E5 G5 C6 - - G5 - C6 - - - E6 - - -', 'D6 - - - B5 - - - G5 - A5 - B5 - - -', 'C6 - - - - - - - - - - - . . . .'],
  },
  chest: {
    bpm: 180, loop: false, drums: 'none', vol: 0.9,
    chords: ['C'],
    melody: ['G5 C6 E6 G6 - - E6 G6 C7 - - - - - - -'],
  },
};
