import { Question, Difficulty } from '../types';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateOptions = (correct: number, maxVal: number): number[] => {
  const options = new Set<number>();
  options.add(correct);

  while (options.size < 4) {
    const offset = getRandomInt(-10, 10);
    const candidate = correct + offset;
    // Ensure candidates are positive and reasonable
    if (candidate >= 0 && candidate !== correct && candidate <= maxVal + 20) {
      options.add(candidate);
    }
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
};

const createQuestion = (id: number, difficulty: Difficulty): Question => {
  let a, b, c, result, text, points;

  switch (difficulty) {
    case 'easy':
      // +/- up to 30
      points = 1;
      if (Math.random() > 0.5) {
        // Addition
        result = getRandomInt(5, 30);
        a = getRandomInt(1, result - 1);
        b = result - a;
        text = `${a} + ${b} = ?`;
      } else {
        // Subtraction
        a = getRandomInt(5, 30);
        b = getRandomInt(1, a - 1);
        result = a - b;
        text = `${a} - ${b} = ?`;
      }
      break;

    case 'medium':
      // + up to 50 (Slightly Complicated)
      points = 2;
      result = getRandomInt(31, 50);

      // 50% chance to be a 3-term addition problem
      if (Math.random() > 0.5) {
        a = getRandomInt(5, Math.floor(result / 2));
        b = getRandomInt(5, result - a - 5);
        c = result - a - b;
        text = `${a} + ${b} + ${c} = ?`;
      } else {
        // Standard 2-term
        a = getRandomInt(10, result - 10);
        b = result - a;
        text = `${a} + ${b} = ?`;
      }
      break;

    case 'hard':
      // + up to 100 (Greatly Complicated)
      points = 3;
      // We determine the structure first, then the numbers.
      const type = Math.random();

      if (type < 0.33) {
        // Variation 1: 3-Term Addition with larger numbers
        result = getRandomInt(51, 100);
        a = getRandomInt(15, result - 20);
        b = getRandomInt(10, result - a - 10);
        c = result - a - b;
        text = `${a} + ${b} + ${c} = ?`;
      } else if (type < 0.66) {
        // Variation 2: Mixed Operations (A + B - C = ?)
        result = getRandomInt(51, 100);
        // Create a temporary sum larger than result
        const tempSum = result + getRandomInt(5, 30); 
        a = getRandomInt(20, tempSum - 10);
        b = tempSum - a;
        c = tempSum - result;
        text = `${a} + ${b} - ${c} = ?`;
      } else {
        // Variation 3: Missing Addend (A + ? = Result)
        // This forces "algebraic" thinking
        const total = getRandomInt(51, 100);
        a = getRandomInt(15, total - 15);
        result = total - a; // The answer is the missing part
        text = `${a} + ? = ${total}`;
      }
      break;
  }

  return {
    id,
    difficulty,
    text,
    correctAnswer: result!,
    options: generateOptions(result!, 120),
    points: points!,
    isSolved: false,
  };
};

export const generateQuiz = (): Question[] => {
  const questions: Question[] = [];
  let idCounter = 1;

  // 24 Easy (Yellow)
  for (let i = 0; i < 24; i++) {
    questions.push(createQuestion(idCounter++, 'easy'));
  }

  // 12 Medium (Blue)
  for (let i = 0; i < 12; i++) {
    questions.push(createQuestion(idCounter++, 'medium'));
  }

  // 4 Hard (Green)
  for (let i = 0; i < 4; i++) {
    questions.push(createQuestion(idCounter++, 'hard'));
  }

  // Randomize positions on the grid
  return questions.sort(() => Math.random() - 0.5);
};