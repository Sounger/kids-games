import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Controls } from './components/Controls';
import { InstrumentRow } from './components/InstrumentRow';
import { FXPanel } from './components/FXPanel';
import { GridRow, InstrumentType } from './types';
import { STEPS, DEFAULT_BPM, INITIAL_ROWS, AVAILABLE_INSTRUMENTS } from './constants';
import { audioEngine } from './services/audioEngine';
import { Music } from 'lucide-react';

const STORAGE_KEY = 'pixelbeats_save_v1';

const App: React.FC = () => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [currentStep, setCurrentStep] = useState(-1);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // FX State
  const [cutoff, setCutoff] = useState(100);
  const [resonance, setResonance] = useState(0);
  const [drive, setDrive] = useState(0);

  // Refs for timing loop
  const stepRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);

  // Initialize Default State
  useEffect(() => {
    const defaultRows: GridRow[] = INITIAL_ROWS.map(id => ({
      instrumentId: id,
      pattern: Array(STEPS).fill(false)
    }));
    setRows(defaultRows);
  }, []);

  // Update Audio Engine FX when state changes
  useEffect(() => {
    if (isAudioInitialized) {
      audioEngine.setFilter(cutoff, resonance);
      audioEngine.setDistortion(drive);
    }
  }, [cutoff, resonance, drive, isAudioInitialized]);

  // Audio Init Helper
  const ensureAudioInit = () => {
    if (!isAudioInitialized) {
      audioEngine.init();
      setIsAudioInitialized(true);
      // Apply initial state
      audioEngine.setFilter(cutoff, resonance);
      audioEngine.setDistortion(drive);
    }
  };

  // Keyboard Event Listeners for FX and Jamming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrows/pageup/down
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
      }

      // FX Controls
      const STEP = 5;
      if (e.code === 'ArrowUp') setCutoff(prev => Math.min(prev + STEP, 100));
      if (e.code === 'ArrowDown') setCutoff(prev => Math.max(prev - STEP, 0));
      if (e.code === 'ArrowRight') setResonance(prev => Math.min(prev + STEP, 100));
      if (e.code === 'ArrowLeft') setResonance(prev => Math.max(prev - STEP, 0));
      if (e.code === 'PageUp') setDrive(prev => Math.min(prev + STEP, 100));
      if (e.code === 'PageDown') setDrive(prev => Math.max(prev - STEP, 0));

      // Jamming Triggers (Numbers 1-6 or Numpad 1-6)
      // Check if not typing in an input (though we don't really have text inputs)
      ensureAudioInit();

      const playOneShot = (type: InstrumentType, pitch?: number) => {
         audioEngine.playSound(type, pitch);
         // Visual feedback? maybe later
      };

      if (e.key === '1') playOneShot('kick');
      if (e.key === '2') playOneShot('snare');
      if (e.key === '3') playOneShot('hihat');
      if (e.key === '4') playOneShot('bass', 65.41); // Low C
      if (e.key === '5') playOneShot('lead', 261.63); // Mid C
      if (e.key === '6') playOneShot('jump'); // SFX
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioInitialized]); // Dependencies need to include audio init state? Actually better to check init inside handler

  // The actual loop effect
  useEffect(() => {
    if (isPlaying) {
      ensureAudioInit();
      const secondsPerBeat = 60.0 / bpm;
      const msPerStep = (secondsPerBeat / 4) * 1000;
      
      const loop = setInterval(() => {
        // Update UI
        setCurrentStep(prev => {
          const next = (prev + 1) % STEPS;
          
          rows.forEach(row => {
            if (row.pattern[next]) {
               const inst = AVAILABLE_INSTRUMENTS.find(i => i.id === row.instrumentId);
               if (inst) {
                 audioEngine.playSound(inst.soundKey, inst.pitch);
               }
            }
          });
          
          return next;
        });
      }, msPerStep);

      timerRef.current = loop as unknown as number;

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      // Reset logic handled in handler
    }
  }, [isPlaying, bpm, rows, isAudioInitialized]);

  // Handlers
  const handlePlayPause = () => {
    ensureAudioInit();
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      setIsPlaying(true);
      setCurrentStep(-1); 
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  const handlePatternChange = (rowIndex: number, stepIndex: number) => {
    const newRows = [...rows];
    newRows[rowIndex].pattern[stepIndex] = !newRows[rowIndex].pattern[stepIndex];
    setRows(newRows);
  };

  const handleInstrumentChange = (rowIndex: number, newId: string) => {
    const newRows = [...rows];
    newRows[rowIndex].instrumentId = newId;
    setRows(newRows);
  };

  const handleAddRow = () => {
    if (rows.length >= 10) {
      showModal("Maximum 10 tracks! Try changing an instrument instead.");
      return;
    }
    setRows([...rows, {
      instrumentId: 'kick', // Default
      pattern: Array(STEPS).fill(false)
    }]);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleClear = () => {
    if (window.confirm("Clear all patterns?")) {
      const newRows = rows.map(r => ({ ...r, pattern: Array(STEPS).fill(false) }));
      setRows(newRows);
      handleStop();
    }
  };

  const handleSave = () => {
    const data = {
      bpm,
      rows
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showModal("Song Saved to Browser!");
  };

  const handleLoad = () => {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        setBpm(data.bpm);
        setRows(data.rows);
        handleStop();
        showModal("Song Loaded!");
      } catch (e) {
        showModal("Error loading song.");
      }
    } else {
      showModal("No saved song found.");
    }
  };

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setTimeout(() => setModalMessage(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#2d1b2e] pb-20 text-white font-['Press_Start_2P']">
      
      {/* Header */}
      <div className="bg-[#ff0055] p-4 text-center border-b-4 border-black shadow-lg">
        <h1 className="text-xl md:text-3xl text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-4">
          <Music size={32} /> PIXEL BEATS <Music size={32} />
        </h1>
      </div>

      <Controls 
        isPlaying={isPlaying}
        bpm={bpm}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onBpmChange={setBpm}
        onClear={handleClear}
        onAddRow={handleAddRow}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4">
        
        {/* Sequencer Grid */}
        <div className="overflow-x-auto pb-4 mb-4">
          <div className="min-w-[800px]">
            {/* Step Indicators (Top) */}
            <div className="flex mb-2 ml-[180px] sm:ml-[200px] gap-1">
               {Array(STEPS).fill(0).map((_, i) => (
                 <React.Fragment key={i}>
                   {(i > 0 && i % 4 === 0) && <div className="w-2" />}
                   <div className={`w-8 sm:w-10 text-center text-[10px] text-gray-500 ${currentStep === i ? 'text-white font-bold' : ''}`}>
                     {i + 1}
                   </div>
                 </React.Fragment>
               ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {rows.map((row, index) => (
                <InstrumentRow
                  key={`${index}-${row.instrumentId}`}
                  row={row}
                  rowIndex={index}
                  currentStep={currentStep}
                  onPatternChange={(step) => handlePatternChange(index, step)}
                  onInstrumentChange={(id) => handleInstrumentChange(index, id)}
                  onRowDelete={() => handleDeleteRow(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* FX Panel */}
        <FXPanel 
          cutoff={cutoff} 
          resonance={resonance} 
          drive={drive}
          onCutoffChange={setCutoff}
          onResonanceChange={setResonance}
          onDriveChange={setDrive}
        />

      </main>

      {/* Instructions / Footer */}
      <footer className="mt-12 text-center text-gray-500 text-xs px-4 pb-8">
        <p>CLICK SQUARES TO MAKE MUSIC • USE HEADPHONES FOR BEST SOUND</p>
        <p className="mt-2 text-[10px] opacity-50">v1.1 • FX UPDATE</p>
      </footer>

      {/* Toast Modal */}
      {modalMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black border-4 border-black p-4 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] z-50 animate-bounce">
          {modalMessage}
        </div>
      )}

      {/* Start Overlay for Audio Context (if not init) */}
      {!isAudioInitialized && (
        <div 
          onClick={ensureAudioInit}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer backdrop-blur-sm"
        >
          <div className="bg-[#ff0055] text-white p-8 border-4 border-white shadow-[10px_10px_0px_#000] text-center hover:scale-105 transition-transform">
            <h2 className="text-2xl mb-4">READY TO ROCK?</h2>
            <p className="text-sm blink">CLICK ANYWHERE TO START</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;