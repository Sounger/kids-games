export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  text: string;
  options: number[];
  correctAnswer: number;
  difficulty: Difficulty;
  points: number;
  isSolved: boolean;
}

export interface Player {
  name: string;
  score: number;
}

export enum GameState {
  IDLE,
  VIEWING_QUESTION,
  NAMING_WINNER,
  VIEWING_STATS,
}
