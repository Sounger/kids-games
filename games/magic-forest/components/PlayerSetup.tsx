
import React, { useState } from 'react';
import { ANIMALS } from '../constants';
import { Play, Sparkles } from 'lucide-react';

interface PlayerSetupProps {
  onStart: (names: string[]) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStart }) => {
  const [names, setNames] = useState<string[]>(ANIMALS.map(a => a.name));

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...names];
    updated[index] = newName;
    setNames(updated);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-emerald-50">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-green-200 max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-game text-green-700 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-yellow-400" />
          MAGIC FOREST
        </h1>
        <p className="text-xl font-bold text-green-600 mb-8">Enter the names of the travelers!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {ANIMALS.map((animal, i) => (
            <div key={i} className="flex items-center gap-3 bg-green-50 p-3 rounded-2xl border-2 border-green-100">
              <span className="text-4xl">{animal.emoji}</span>
              <input
                type="text"
                maxLength={12}
                value={names[i]}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="w-full bg-white border-2 border-green-200 rounded-xl px-3 py-2 font-bold text-gray-700 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => onStart(names)}
          className="group relative inline-flex items-center justify-center gap-4 bg-green-500 hover:bg-green-600 text-white font-game text-3xl py-6 px-16 rounded-full shadow-[0_10px_0_rgb(22,163,74)] transition-all hover:translate-y-[2px] hover:shadow-[0_8px_0_rgb(22,163,74)] active:translate-y-[10px] active:shadow-none"
        >
          <Play className="w-8 h-8 fill-current" />
          START GAME
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;
