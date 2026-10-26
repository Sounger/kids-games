
import { DifficultyRange, MathOperation, MathProblem } from '../types';

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generateProblem = (
  operation: MathOperation,
  difficulty: DifficultyRange
): MathProblem => {
  let a = 0, b = 0, answer = 0;
  
  // Resolve Mixed mode to a specific operation for this problem
  let currentOp: 'ADDITION' | 'SUBTRACTION' = 'ADDITION';
  if (operation === 'MIXED') {
    currentOp = Math.random() > 0.5 ? 'ADDITION' : 'SUBTRACTION';
  } else {
    currentOp = operation as 'ADDITION' | 'SUBTRACTION';
  }

  // --- Generation Logic based on prompt ---
  if (difficulty === '1-10') {
    if (currentOp === 'ADDITION') {
      // A, B in [1, 5], Sum <= 10
      a = getRandomInt(1, 5);
      b = getRandomInt(1, 5);
      answer = a + b;
    } else {
      // A in [6, 10], B in [1, 5], Diff >= 1
      a = getRandomInt(6, 10);
      b = getRandomInt(1, 5);
      answer = a - b;
    }
  } else if (difficulty === '1-20') {
    if (currentOp === 'ADDITION') {
      // A, B in [5, 15], Sum <= 20
      do {
        a = getRandomInt(5, 15);
        b = getRandomInt(5, 15);
      } while (a + b > 20);
      answer = a + b;
    } else {
      // A in [10, 20], B in [1, 15], Diff >= 1. Focus on crossing ten.
      do {
        a = getRandomInt(10, 20);
        b = getRandomInt(1, 15);
      } while (a - b < 1);
      answer = a - b;
    }
  } else if (difficulty === '1-100') {
    if (currentOp === 'ADDITION') {
      // A, B in [10, 99], Sum <= 100
      do {
        a = getRandomInt(10, 99);
        b = getRandomInt(10, 99);
      } while (a + b > 100);
      answer = a + b;
    } else {
      // A in [50, 99], B in [10, 49], Diff >= 1
      a = getRandomInt(50, 99);
      b = getRandomInt(10, 49);
      answer = a - b;
    }
  }

  // --- Distractor Generation ---
  const options = new Set<number>();
  options.add(answer);

  // 1. Simple Shift (+/- 1)
  options.add(Math.random() > 0.5 ? answer + 1 : answer - 1);

  // 2. Ten Error (e.g., 13+7=20 -> 10) or random close
  if (currentOp === 'ADDITION') {
    // If answer is 20, maybe suggest 10? Or simple digit addition error 13+5=18 -> 19
    const tenError = answer > 10 ? answer - 10 : answer + 10;
    if (tenError > 0) options.add(tenError);
  } else {
     // Subtraction error
     const tenError = answer + 10; // Forgot to borrow
     if (tenError < 100) options.add(tenError);
  }

  // 3. Unit Error (e.g. 23+5 = 28 -> 29)
  const unitError = answer + (Math.random() > 0.5 ? 2 : -2);
  if (unitError > 0) options.add(unitError);

  // Fill remaining slots with random reasonable numbers if Set killed duplicates
  while (options.size < 4) {
    let randomOffset = getRandomInt(-5, 5);
    if (randomOffset === 0) randomOffset = 3;
    const val = answer + randomOffset;
    if (val > 0 && val <= (difficulty === '1-100' ? 100 : 20)) {
      options.add(val);
    } else {
        options.add(answer + 4); // Fallback
    }
  }

  const finalOptions = shuffleArray(Array.from(options));
  const symbol = currentOp === 'ADDITION' ? '+' : '-';

  return {
    question: `${a} ${symbol} ${b} = ?`,
    answer,
    options: finalOptions,
    operands: [a, b],
    operation: currentOp
  };
};