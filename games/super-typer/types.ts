export type ScreenState = 'welcome' | 'mode-select' | 'category' | 'game' | 'result';
export type GameMode = 'classic' | 'gravity';

export interface WordCategory {
  id: string;
  label: string;
  emoji: string;
  words: string[];
  color: string;
}

export interface GameResult {
  playerName: string;
  score: number;
  totalTime: number; // in seconds
  timestamp: number;
  categoryLabel: string;
  mode: GameMode;
}

export interface GameState {
  currentWordIndex: number;
  currentWord: string;
  score: number;
  wordStartTime: number;
  sessionStartTime: number;
  gameWords: string[];
}
