
export type DifficultyRange = '1-10' | '1-20' | '1-100';
export type MathOperation = 'ADDITION' | 'SUBTRACTION' | 'MIXED';

export interface PlayerStats {
  name: string;
  totalSessions: number;
  totalCorrect: number;
  totalAttempts: number;
  monstersDefeated: number;
  deaths: number;
  rangeStats: Record<string, {
    correct: number;
    attempts: number;
    bestSessionOpenDoors: number;
    totalTimeSeconds: number;
  }>;
}

export interface SessionStats {
  durationSeconds: number;
  doorsOpened: number;
  mistakes: number;
  accuracy: number;
  difficulty: DifficultyRange;
  operation: MathOperation;
  livesRemaining: number;
  bonusEmojis: number;
  won: boolean;
}

export interface MathProblem {
  question: string;
  answer: number;
  options: number[];
  operands: [number, number];
  operation: MathOperation;
}

export interface Entity {
  id: string;
  type: 'PLAYER' | 'MONSTER' | 'ITEM_HEART' | 'ITEM_WEAPON' | 'ITEM_EMOJI' | 'EXIT';
  monsterType?: 'GHOST' | 'BUG' | 'BOT' | 'BOSS';
  ticksUntilMove?: number;
  health?: number;
  maxHealth?: number;
  x: number;
  y: number;
}

export interface Tile {
  x: number;
  y: number;
  type: 'FLOOR' | 'WALL' | 'DOOR_CLOSED' | 'DOOR_OPEN' | 'DOOR_LOCKED' | 'VOID';
  mathProblem?: MathProblem;
  item?: {
    type: 'HEART' | 'WEAPON' | 'EMOJI';
    value?: number;
  };
}

export type GameState = 'MENU' | 'PLAYING' | 'MATH_MODAL' | 'GAME_OVER' | 'VICTORY' | 'STATS';