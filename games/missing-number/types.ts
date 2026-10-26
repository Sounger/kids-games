export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface NumberItem {
  digit: number;
  word: string;
  isMissing: boolean;
}

export interface QuizOption {
  digit: number;
  word: string;
}

export interface QuizQuestion {
  sequence: NumberItem[];
  options: QuizOption[];
  correctOptionIndex: number;
  patternDescription: string;
}

export interface QuizState {
  status: 'menu' | 'loading' | 'playing' | 'results' | 'error';
  difficulty: Difficulty;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  errorMessage?: string;
}