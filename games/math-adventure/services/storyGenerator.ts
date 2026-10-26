// Makes math word problems and scene pictures locally — no AI, no API key.
import { MathProblem } from '../types';

interface ThemeInfo {
  who: string;          // main character
  one: string;          // singular item
  many: string;         // plural item
  gain: string;         // "found", "picked up"...
  lose: string;         // past-tense verb for taking away
  scene: string[];      // emoji for the picture
  bg: [string, string]; // background gradient
}

const THEMES: Record<string, ThemeInfo> = {
  'Space Adventure': { who: 'A little alien', one: 'space rock', many: 'space rocks', gain: 'found', lose: 'dropped', scene: ['👽', '🚀', '🪐', '⭐', '🌙'], bg: ['#1e1b4b', '#4c1d95'] },
  'Dinosaurs': { who: 'A baby dinosaur', one: 'leaf', many: 'leaves', gain: 'found', lose: 'ate', scene: ['🦕', '🦖', '🌿', '🌋', '🥚'], bg: ['#bbf7d0', '#fde68a'] },
  'Magic School': { who: 'A young wizard', one: 'magic wand', many: 'magic wands', gain: 'made', lose: 'lost', scene: ['🧙', '🪄', '📚', '✨', '🦉'], bg: ['#ede9fe', '#c4b5fd'] },
  'Deep Ocean': { who: 'A happy fish', one: 'shell', many: 'shells', gain: 'found', lose: 'gave away', scene: ['🐠', '🐙', '🐚', '🫧', '🐳'], bg: ['#bae6fd', '#1d4ed8'] },
  'Superheroes': { who: 'A superhero', one: 'cat', many: 'cats', gain: 'saved', lose: 'took home', scene: ['🦸', '🐱', '🏙️', '💥', '⚡'], bg: ['#fecaca', '#fde047'] },
  'Tiny Insects': { who: 'A busy ant', one: 'crumb', many: 'crumbs', gain: 'carried', lose: 'ate', scene: ['🐜', '🐞', '🦋', '🐝', '🌼'], bg: ['#dcfce7', '#86efac'] },
  'Sports Day': { who: 'Coach Tom', one: 'ball', many: 'balls', gain: 'brought', lose: 'lost', scene: ['⚽', '🏀', '🏃', '🥇', '🎽'], bg: ['#dbeafe', '#bbf7d0'] },
  'Fairies & Elves': { who: 'A tiny fairy', one: 'flower', many: 'flowers', gain: 'picked', lose: 'gave away', scene: ['🧚', '🌸', '🍄', '✨', '🌷'], bg: ['#fce7f3', '#f9a8d4'] },
  'Construction Site': { who: 'A big truck', one: 'brick', many: 'bricks', gain: 'carried', lose: 'used', scene: ['🚜', '🏗️', '🧱', '🚧', '👷'], bg: ['#fef3c7', '#fdba74'] },
  'Funny Monsters': { who: 'A silly monster', one: 'cookie', many: 'cookies', gain: 'baked', lose: 'gobbled up', scene: ['👾', '👹', '🍪', '😜', '🎈'], bg: ['#d9f99d', '#a5f3fc'] },
  'Pirates': { who: 'Captain Pip', one: 'gold coin', many: 'gold coins', gain: 'dug up', lose: 'spent', scene: ['🏴‍☠️', '🦜', '💰', '🏝️', '⛵'], bg: ['#bae6fd', '#fde68a'] },
  'Jungle Animals': { who: 'A cheeky monkey', one: 'banana', many: 'bananas', gain: 'picked', lose: 'ate', scene: ['🐒', '🦁', '🐘', '🍌', '🌴'], bg: ['#bbf7d0', '#4ade80'] },
  'Robots': { who: 'A friendly robot', one: 'battery', many: 'batteries', gain: 'built', lose: 'used', scene: ['🤖', '🔋', '⚙️', '🔧', '💡'], bg: ['#e2e8f0', '#94a3b8'] },
  'Knights & Dragons': { who: 'A brave knight', one: 'shield', many: 'shields', gain: 'made', lose: 'gave away', scene: ['🛡️', '🐉', '🏰', '⚔️', '👑'], bg: ['#e0e7ff', '#fca5a5'] },
  'Farm Animals': { who: 'Farmer Joe', one: 'egg', many: 'eggs', gain: 'collected', lose: 'sold', scene: ['🐄', '🐔', '🐷', '🥚', '🚜'], bg: ['#fef9c3', '#bbf7d0'] },
  'Candy Land': { who: 'A candy kid', one: 'lollipop', many: 'lollipops', gain: 'got', lose: 'shared', scene: ['🍭', '🍬', '🧁', '🍩', '🍫'], bg: ['#fce7f3', '#fbcfe8'] },
  'Toy Store': { who: 'Mia', one: 'toy car', many: 'toy cars', gain: 'bought', lose: 'gave away', scene: ['🧸', '🚗', '🪀', '🎲', '🪁'], bg: ['#fef3c7', '#fecaca'] },
  'Zoo': { who: 'The zoo keeper', one: 'apple', many: 'apples', gain: 'brought', lose: 'gave away', scene: ['🦒', '🐼', '🦓', '🐧', '🍎'], bg: ['#dcfce7', '#fef08a'] },
  'Camping': { who: 'Sam', one: 'marshmallow', many: 'marshmallows', gain: 'roasted', lose: 'ate', scene: ['⛺', '🔥', '🌲', '🌙', '🦉'], bg: ['#1e3a8a', '#065f46'] },
  'Birthday Party': { who: 'Lily', one: 'balloon', many: 'balloons', gain: 'got', lose: 'popped', scene: ['🎂', '🎈', '🎁', '🥳', '🎉'], bg: ['#fae8ff', '#fde68a'] },
};

const FALLBACK = THEMES['Birthday Party'];

const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** "A baby dinosaur" -> "the baby dinosaur" for the second sentence. */
const theWho = (t: ThemeInfo) => t.who.replace(/^(A|The) /, 'the ');

const count = (n: number, t: ThemeInfo) => `${n} ${n === 1 ? t.one : t.many}`;

const makeOptions = (answer: number): number[] => {
  const pool = shuffle([answer + 1, answer - 1, answer + 2, answer - 2, answer + 3, answer - 3])
    .filter(n => n >= 0 && n <= 20 && n !== answer);
  return shuffle([answer, pool[0], pool[1]]);
};

export const generateMathProblem = async (isMixed: boolean, theme: string): Promise<MathProblem> => {
  const t = THEMES[theme] ?? FALLBACK;
  let question: string;
  let answer: number;

  if (isMixed) {
    const a = randInt(2, 12);
    const b = randInt(1, 20 - a);
    const c = randInt(1, a + b);
    answer = a + b - c;
    question = `${t.who} has ${count(a, t)}. Then ${theWho(t)} ${t.gain} ${b} more. After that, ${theWho(t)} ${t.lose} ${c}. How many ${t.many} now?`;
  } else if (Math.random() < 0.5) {
    answer = randInt(2, 20);
    const a = randInt(1, answer - 1);
    const b = answer - a;
    question = `${t.who} has ${count(a, t)} and ${t.gain} ${b} more. How many ${t.many} altogether?`;
  } else {
    const a = randInt(3, 20);
    const b = randInt(1, a);
    answer = a - b;
    const who = theWho(t);
    question = `${t.who} has ${count(a, t)}. ${who[0].toUpperCase() + who.slice(1)} ${t.lose} ${b}. How many ${t.many} are left?`;
  }

  // the picture uses the theme name as its "description"
  return { question, correctAnswer: answer, options: makeOptions(answer), imageDescription: theme };
};

/** Builds a cheerful SVG scene for the theme (mood only — no numbers to count). */
export const generateIllustration = async (theme: string): Promise<string> => {
  const t = THEMES[theme] ?? FALLBACK;
  const [c1, c2] = t.bg;
  const spots = shuffle([
    [140, 150, 120], [430, 120, 90], [650, 170, 110], [250, 330, 100],
    [560, 330, 130], [100, 380, 80], [720, 390, 70], [380, 230, 70],
  ]);
  const items = spots.map(([x, y, s], i) => {
    const e = t.scene[i % t.scene.length];
    const rot = randInt(-15, 15);
    return `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot} ${x} ${y})">${e}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="700" cy="70" r="40" fill="#fff" opacity="0.35"/>
    <ellipse cx="400" cy="470" rx="520" ry="90" fill="#fff" opacity="0.25"/>
    <g font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${items}</g>
  </svg>`;
  await new Promise(r => setTimeout(r, 300));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
