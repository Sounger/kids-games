// Generates "Missing Number" quizzes locally — no AI, no API key.
import { Difficulty, QuizQuestion, QuizOption } from '../types';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export const numberToWord = (n: number): string => {
  if (n < 20) return ONES[n];
  if (n === 100) return 'one hundred';
  const t = Math.floor(n / 10), o = n % 10;
  return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
};

const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

interface Level { min: number; max: number; steps: number[]; }

const LEVELS: Record<Difficulty, Level> = {
  [Difficulty.EASY]: { min: 0, max: 30, steps: [1, 2, 5] },
  [Difficulty.MEDIUM]: { min: 30, max: 50, steps: [5, 10, 2] },
  [Difficulty.HARD]: { min: 50, max: 100, steps: [10, 20, 5] },
};

const LENGTH = 5;

/** Builds one sequence that stays inside the level's range. */
const makeSequence = (level: Level) => {
  for (let tries = 0; tries < 200; tries++) {
    const step = pick(level.steps);
    const down = Math.random() < 0.35;
    const delta = down ? -step : step;
    const start = randInt(level.min, level.max);
    const nums = Array.from({ length: LENGTH }, (_, i) => start + delta * i);
    if (nums.every(n => n >= level.min && n <= level.max)) {
      return { nums, desc: `Count ${down ? 'down' : 'up'} by ${step}` };
    }
  }
  return { nums: [1, 2, 3, 4, 5].map(n => n + level.min), desc: 'Count up by 1' };
};

/** Wrong answers that look tempting: off by one, off by ten, or the wrong step. */
const makeDistractors = (answer: number, step: number, level: Level, shown: number[]): number[] => {
  const lo = Math.max(0, level.min - 5), hi = Math.min(100, level.max + 5);
  // a good wrong answer is close to the range and not already visible in the row
  const ok = (c: number, out: number[]) => c !== answer && c >= lo && c <= hi && !shown.includes(c) && !out.includes(c);
  const candidates = shuffle([
    answer + 1, answer - 1, answer + 10, answer - 10,
    answer + step, answer - step, answer + 2, answer - 2,
    // swap tens and ones place (e.g. 31 ↔ 13)
    answer >= 10 && answer < 100 ? (answer % 10) * 10 + Math.floor(answer / 10) : -1,
  ]);
  const out: number[] = [];
  for (const c of candidates) {
    if (ok(c, out)) out.push(c);
    if (out.length === 3) break;
  }
  while (out.length < 3) {
    const c = randInt(lo, hi);
    if (ok(c, out)) out.push(c);
  }
  return out;
};

const makeQuestion = (difficulty: Difficulty): QuizQuestion => {
  const level = LEVELS[difficulty];
  const { nums, desc } = makeSequence(level);
  const missingIdx = randInt(1, LENGTH - 1);
  const answer = nums[missingIdx];
  const step = Math.abs(nums[1] - nums[0]);
  const optionNums = shuffle([answer, ...makeDistractors(answer, step, level, nums)]);
  const options: QuizOption[] = optionNums.map(n => ({ digit: n, word: numberToWord(n) }));
  return {
    sequence: nums.map((n, i) => ({ digit: n, word: numberToWord(n), isMissing: i === missingIdx })),
    options,
    correctOptionIndex: optionNums.indexOf(answer),
    patternDescription: desc,
  };
};

export const generateQuiz = async (difficulty: Difficulty): Promise<QuizQuestion[]> => {
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  while (questions.length < 5) {
    const q = makeQuestion(difficulty);
    const key = q.sequence.map(s => s.digit).join(',');
    if (!seen.has(key)) { seen.add(key); questions.push(q); }
  }
  // tiny pause so the loading animation doesn't just flash
  await new Promise(r => setTimeout(r, 400));
  return questions;
};
