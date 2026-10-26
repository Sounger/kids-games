export type SoundType = 'drum' | 'instrument' | 'effect';

export type InstrumentType = 
  | 'kick' 
  | 'snare' 
  | 'hihat' 
  | 'tom'
  | 'bass' 
  | 'lead' 
  | 'arpeggio' 
  | 'coin' 
  | 'jump' 
  | 'laser';

export interface Instrument {
  id: string;
  name: string;
  type: SoundType;
  soundKey: InstrumentType;
  color: string; // Tailwind color class piece (e.g., 'red-500')
  pitch?: number; // Base frequency for instruments
}

export interface GridRow {
  instrumentId: string;
  pattern: boolean[]; // Array of 16 steps
}

export interface AppState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  rows: GridRow[];
}