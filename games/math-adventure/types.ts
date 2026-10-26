export interface MathProblem {
  question: string;
  options: number[];
  correctAnswer: number;
  imageDescription: string;
}

export enum GameState {
  START = 'START',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
