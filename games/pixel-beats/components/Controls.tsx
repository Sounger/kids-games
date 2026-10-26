import React from 'react';
import { Play, Square, Save, FolderOpen, Plus, Trash2, RotateCcw } from 'lucide-react';
import { MAX_BPM, MIN_BPM } from '../constants';

interface ControlsProps {
  isPlaying: boolean;
  bpm: number;
  onPlayPause: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onClear: () => void;
  onAddRow: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  bpm,
  onPlayPause,
  onStop,
  onBpmChange,
  onClear,
  onAddRow,
  onSave,
  onLoad
}) => {
  return (
    <div className="bg-[#4a3b4e] p-4 border-b-4 border-black mb-6 sticky top-0 z-30 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Main Transport */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className={`
              flex items-center justify-center w-16 h-12 
              border-b-4 border-r-4 border-black active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1
              font-bold transition-all
              ${isPlaying ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'}
            `}
          >
            {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>

          <button
             onClick={onStop}
             className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-500 border-b-4 border-r-4 border-black active:border-0 active:mt-1"
             title="Stop & Rewind"
          >
            <RotateCcw size={20} />
          </button>

          {/* BPM Slider */}
          <div className="flex flex-col items-center bg-black/30 p-2 rounded">
             <label className="text-[10px] text-gray-300 mb-1">TEMPO: {bpm}</label>
             <input 
               type="range" 
               min={MIN_BPM} 
               max={MAX_BPM} 
               value={bpm} 
               onChange={(e) => onBpmChange(Number(e.target.value))}
               className="w-32 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
             />
          </div>
        </div>

        {/* Editing Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs border-b-4 border-r-4 border-black active:border-0 active:translate-y-1"
          >
            <Plus size={16} /> ADD TRACK
          </button>
          
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs border-b-4 border-r-4 border-black active:border-0 active:translate-y-1"
          >
            <Trash2 size={16} /> CLEAR
          </button>
        </div>

        {/* Storage Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs border-b-4 border-r-4 border-black active:border-0 active:translate-y-1"
          >
            <Save size={16} /> SAVE
          </button>
          <button
            onClick={onLoad}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs border-b-4 border-r-4 border-black active:border-0 active:translate-y-1"
          >
            <FolderOpen size={16} /> LOAD
          </button>
        </div>

      </div>
    </div>
  );
};