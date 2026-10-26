import { Instrument } from './types';

export const STEPS = 16;
export const DEFAULT_BPM = 120;
export const MAX_BPM = 240;
export const MIN_BPM = 60;

export const AVAILABLE_INSTRUMENTS: Instrument[] = [
  // Drums
  { id: 'kick', name: 'Kick', type: 'drum', soundKey: 'kick', color: 'blue-500' },
  { id: 'snare', name: 'Snare', type: 'drum', soundKey: 'snare', color: 'blue-400' },
  { id: 'hihat', name: 'Hi-Hat', type: 'drum', soundKey: 'hihat', color: 'cyan-400' },
  { id: 'tom', name: 'Tom', type: 'drum', soundKey: 'tom', color: 'blue-600' },

  // Bass
  { id: 'bass_c', name: 'Bass C', type: 'instrument', soundKey: 'bass', pitch: 65.41, color: 'green-600' },
  { id: 'bass_e', name: 'Bass E', type: 'instrument', soundKey: 'bass', pitch: 82.41, color: 'green-500' },
  { id: 'bass_g', name: 'Bass G', type: 'instrument', soundKey: 'bass', pitch: 98.00, color: 'green-400' },

  // Lead
  { id: 'lead_c', name: 'Lead C', type: 'instrument', soundKey: 'lead', pitch: 261.63, color: 'yellow-500' },
  { id: 'lead_e', name: 'Lead E', type: 'instrument', soundKey: 'lead', pitch: 329.63, color: 'yellow-400' },
  { id: 'lead_g', name: 'Lead G', type: 'instrument', soundKey: 'lead', pitch: 392.00, color: 'yellow-300' },
  { id: 'lead_c2', name: 'Lead C2', type: 'instrument', soundKey: 'lead', pitch: 523.25, color: 'orange-400' },

  // Effects
  { id: 'fx_coin', name: 'Coin', type: 'effect', soundKey: 'coin', color: 'pink-500' },
  { id: 'fx_jump', name: 'Jump', type: 'effect', soundKey: 'jump', color: 'purple-500' },
  { id: 'fx_laser', name: 'Laser', type: 'effect', soundKey: 'laser', color: 'red-500' },
];

export const INITIAL_ROWS: string[] = [
  'kick',
  'snare',
  'hihat',
  'bass_c',
  'lead_c',
  'fx_coin'
];