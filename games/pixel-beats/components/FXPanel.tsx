import React from 'react';
import { FXKnob } from './FXKnob';
import { Zap, Activity, Speaker, Keyboard } from 'lucide-react';

interface FXPanelProps {
  cutoff: number;
  resonance: number;
  drive: number;
  onCutoffChange: (val: number) => void;
  onResonanceChange: (val: number) => void;
  onDriveChange: (val: number) => void;
}

export const FXPanel: React.FC<FXPanelProps> = ({
  cutoff,
  resonance,
  drive,
  onCutoffChange,
  onResonanceChange,
  onDriveChange
}) => {
  return (
    <div className="mt-8 mx-auto max-w-4xl">
      <div className="bg-[#1a1120] border-4 border-gray-700 p-4 relative shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
        
        {/* Title Badge */}
        <div className="absolute -top-5 left-4 bg-yellow-500 text-black px-3 py-1 border-2 border-black font-bold text-xs flex items-center gap-2">
          <Zap size={14} fill="black" /> LIVE FX STATION
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
          
          {/* Knobs Area */}
          <div className="flex justify-center gap-8 md:gap-12 flex-1">
            <div className="relative">
              <FXKnob 
                label="Filter Freq" 
                value={cutoff} 
                onChange={onCutoffChange} 
                color="bg-green-500" 
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">
                <span className="border border-gray-600 px-1 rounded">▲</span> / <span className="border border-gray-600 px-1 rounded">▼</span> ARROWS
              </div>
            </div>

            <div className="relative">
              <FXKnob 
                label="Resonance" 
                value={resonance} 
                onChange={onResonanceChange} 
                color="bg-cyan-500" 
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">
                <span className="border border-gray-600 px-1 rounded">◀</span> / <span className="border border-gray-600 px-1 rounded">▶</span> ARROWS
              </div>
            </div>

            <div className="relative">
              <FXKnob 
                label="Crunch" 
                value={drive} 
                onChange={onDriveChange} 
                color="bg-red-500" 
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">
                 PAGE UP/DOWN
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-1 h-24 bg-gray-800"></div>

          {/* Jam Pad Instructions */}
          <div className="flex-1 w-full text-center md:text-left">
             <h3 className="text-xs text-pink-500 mb-3 flex items-center justify-center md:justify-start gap-2">
               <Keyboard size={16} /> JAM PAD MODE
             </h3>
             <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">1</span> KICK
                </div>
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">2</span> SNARE
                </div>
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">3</span> HIHAT
                </div>
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">4</span> BASS
                </div>
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">5</span> LEAD
                </div>
                <div className="bg-gray-800 p-2 rounded border-b-2 border-black text-center active:bg-pink-600 transition-colors">
                  <span className="block text-white font-bold text-sm">6</span> SFX
                </div>
             </div>
             <p className="mt-2 text-[9px] text-gray-500 text-center">
               Use Numpad or Number keys to play live!
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};