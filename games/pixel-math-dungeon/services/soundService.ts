
let audioCtx: AudioContext | null = null;
let bgmGainNode: GainNode | null = null;
let nextNoteTime = 0;
let timerID: number | null = null;
let currentSong: 'MENU' | 'GAME' | null = null;
let noteIndex = 0;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Resume context on user interaction if needed
export const initAudio = () => {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
};

// --- SFX HELPERS ---

const beep = (freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.1) => {
    const ctx = getCtx();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

const noise = (duration: number) => {
    const ctx = getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    noiseSrc.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start();
};

// --- MUSIC SEQUENCER ---

// Simple frequency map
const F = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  NULL: 0
};

// Song Data
const SONGS = {
  MENU: {
    tempo: 100,
    notes: [
      F.C3, F.NULL, F.E3, F.NULL, F.G3, F.NULL, F.B3, F.NULL,
      F.A3, F.NULL, F.F3, F.NULL, F.D3, F.NULL, F.C3, F.NULL
    ]
  },
  GAME: {
    tempo: 220, // Faster
    notes: [
      F.E3, F.E3, F.G3, F.E3, F.A3, F.NULL, F.G3, F.NULL,
      F.D3, F.D3, F.F3, F.D3, F.G3, F.NULL, F.F3, F.NULL
    ]
  }
};

const scheduleNote = (freq: number, time: number, duration: number) => {
  const ctx = getCtx();
  if (!ctx || !bgmGainNode) return;

  if (freq === 0) return;

  const osc = ctx.createOscillator();
  osc.type = 'square'; // 8-bit style
  osc.frequency.value = freq;
  
  // Envelope for the note to make it plucky
  const noteGain = ctx.createGain();
  noteGain.gain.setValueAtTime(0.05, time); // Lower volume for BGM
  noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);

  osc.connect(noteGain);
  noteGain.connect(bgmGainNode); // Connect to master BGM gain
  
  osc.start(time);
  osc.stop(time + duration);
};

const scheduler = () => {
  const ctx = getCtx();
  if (!ctx || !currentSong) return;

  // Schedule ahead
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
    const songData = SONGS[currentSong];
    const secondsPerBeat = 60.0 / songData.tempo;
    const freq = songData.notes[noteIndex % songData.notes.length];
    
    scheduleNote(freq, nextNoteTime, secondsPerBeat);

    nextNoteTime += secondsPerBeat;
    noteIndex++;
  }

  timerID = window.setTimeout(scheduler, lookahead);
};

export const playMusic = (song: 'MENU' | 'GAME' | null) => {
  const ctx = getCtx();
  if (!ctx) return;

  if (song === currentSong) return;

  // Cleanup old song
  if (timerID) clearTimeout(timerID);
  
  // Setup new state
  currentSong = song;
  noteIndex = 0;
  
  if (song) {
    // Ensure BGM gain node exists
    if (!bgmGainNode) {
      bgmGainNode = ctx.createGain();
      bgmGainNode.connect(ctx.destination);
      bgmGainNode.gain.value = 0.5; // Master BGM volume
    }
    
    // Reset time if it fell behind significantly or if starting fresh
    nextNoteTime = Math.max(ctx.currentTime + 0.1, nextNoteTime);
    scheduler();
  }
};

export const stopMusic = () => {
  if (timerID) clearTimeout(timerID);
  currentSong = null;
};

// --- SFX EXPORT ---

export type SoundType = 'step' | 'door_open' | 'door_locked' | 'correct' | 'wrong' | 'heal' | 'powerup' | 'coin' | 'damage' | 'kill' | 'start' | 'win' | 'lose' | 'boss_spawn' | 'boss_hit';

export const playSound = (type: SoundType) => {
    switch(type) {
        case 'step':
            beep(100, 0.05, 'triangle', 0.03);
            break;
        case 'door_open':
            beep(300, 0.1, 'square');
            setTimeout(() => beep(500, 0.2, 'square'), 100);
            break;
        case 'door_locked':
             beep(100, 0.2, 'sawtooth', 0.1);
             break;
        case 'correct':
            beep(600, 0.1, 'sine', 0.1);
            setTimeout(() => beep(900, 0.1, 'sine', 0.1), 100);
            setTimeout(() => beep(1200, 0.3, 'sine', 0.1), 200);
            break;
        case 'wrong':
            beep(300, 0.2, 'sawtooth', 0.1);
            setTimeout(() => beep(150, 0.4, 'sawtooth', 0.1), 200);
            break;
        case 'heal':
             beep(400, 0.1, 'sine', 0.1);
             setTimeout(() => beep(600, 0.1, 'sine', 0.1), 100);
             setTimeout(() => beep(1000, 0.3, 'sine', 0.1), 200);
             break;
        case 'powerup':
            beep(200, 0.1, 'square', 0.1);
             setTimeout(() => beep(400, 0.3, 'square', 0.1), 100);
             break;
        case 'coin':
            beep(1200, 0.08, 'square', 0.05);
            setTimeout(() => beep(1600, 0.15, 'square', 0.05), 60);
            break;
        case 'damage':
             noise(0.2);
             break;
        case 'kill':
             beep(150, 0.1, 'sawtooth', 0.1);
             setTimeout(() => noise(0.2), 50);
             break;
        case 'start':
             beep(440, 0.1, 'square', 0.1);
             setTimeout(() => beep(660, 0.4, 'square', 0.1), 100);
             break;
        case 'boss_spawn':
            beep(100, 0.5, 'sawtooth', 0.3);
            setTimeout(() => beep(80, 0.5, 'sawtooth', 0.3), 300);
            break;
        case 'boss_hit':
            beep(80, 0.1, 'sawtooth', 0.2);
            setTimeout(() => noise(0.1), 50);
            break;
        case 'win':
            [523, 659, 783, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'square', 0.1), i*120));
            break;
        case 'lose':
            [500, 450, 400, 350, 300].forEach((f, i) => setTimeout(() => beep(f, 0.4, 'sawtooth', 0.15), i*250));
            break;
    }
};