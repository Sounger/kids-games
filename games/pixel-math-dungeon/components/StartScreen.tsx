
import React, { useState } from 'react';
import { DifficultyRange, MathOperation } from '../types';
import { Trophy, Zap } from 'lucide-react';
import { playSound, initAudio } from '../services/soundService';

interface Props {
  onStart: (name: string, diff: DifficultyRange, op: MathOperation, quickMode: boolean) => void;
  initialName: string;
  onViewStats: () => void;
}

const StartScreen: React.FC<Props> = ({ onStart, initialName, onViewStats }) => {
  const [name, setName] = useState(initialName);
  const [difficulty, setDifficulty] = useState<DifficultyRange>('1-10');
  const [operation, setOperation] = useState<MathOperation>('ADDITION');

  // Simple validation
  const isValid = name.trim().length > 0;

  const handleStart = (quickMode: boolean) => {
    initAudio(); // Ensure context is running
    if (isValid) {
      playSound('start');
      onStart(name, difficulty, operation, quickMode);
    }
  };

  return (
    <div className="relative z-10 p-8 max-w-md w-full" onClick={initAudio}>
      <div className="bg-white/10 backdrop-blur-md border-4 border-yellow-400 p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-[1.01]">
        
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 drop-shadow-md mb-2 animate-bounce-slow">
            PIXEL MATH
          </h1>
          <p className="text-xl text-gray-300">Dungeon Explorer</p>
        </div>

        <div className="space-y-6">
          
          <div>
            <label className="block text-xl text-yellow-200 mb-2">Hero Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-black/50 border-2 border-white/30 text-white p-3 text-2xl focus:border-yellow-400 outline-none rounded-none pixel-shadow"
            />
          </div>

          <div>
            <label className="block text-xl text-yellow-200 mb-2">Mission Type</label>
            <div className="flex gap-4">
              {(['ADDITION', 'SUBTRACTION', 'MIXED'] as MathOperation[]).map(op => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`flex-1 p-3 text-xl font-bold border-4 transition-all ${
                    operation === op 
                      ? 'bg-blue-600 border-white scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {op === 'ADDITION' ? '+' : op === 'SUBTRACTION' ? '-' : '?'} 
                  <span className="block text-sm">{op === 'ADDITION' ? 'Add' : op === 'SUBTRACTION' ? 'Sub' : 'Mixed'}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xl text-yellow-200 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['1-10', '1-20', '1-100'] as DifficultyRange[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 p-2 font-bold border-4 transition-all ${
                    difficulty === diff 
                      ? 'bg-purple-600 border-white scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleStart(false)}
              disabled={!isValid}
              className={`flex-1 p-4 text-2xl font-bold border-b-8 border-r-8 transition-all active:border-b-0 active:border-r-0 active:translate-y-2 active:translate-x-2 ${
                isValid 
                  ? 'bg-green-500 border-green-700 text-white shadow-lg hover:bg-green-400' 
                  : 'bg-gray-500 border-gray-700 text-gray-300 cursor-not-allowed'
              }`}
            >
              START ADVENTURE
            </button>
            
            <button
              onClick={() => handleStart(true)}
              disabled={!isValid}
              className={`flex-0.5 p-4 text-2xl font-bold border-b-8 border-r-8 transition-all active:border-b-0 active:border-r-0 active:translate-y-2 active:translate-x-2 flex flex-col items-center justify-center ${
                isValid 
                  ? 'bg-orange-500 border-orange-700 text-white shadow-lg hover:bg-orange-400' 
                  : 'bg-gray-500 border-gray-700 text-gray-300 cursor-not-allowed'
              }`}
              title="Small Map, Faster Game"
            >
              <Zap size={24} />
              <span className="text-sm">QUICK</span>
            </button>
          </div>
          
          <button
            onClick={() => { initAudio(); onViewStats(); }}
            className="w-full p-2 text-xl text-yellow-400 hover:text-yellow-200 flex items-center justify-center gap-2"
          >
             <Trophy size={20} /> View Hero Stats
          </button>

        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="fixed top-10 left-10 text-yellow-500/20 text-9xl -z-10 animate-float">?</div>
      <div className="fixed bottom-10 right-10 text-blue-500/20 text-9xl -z-10 animate-float" style={{animationDelay: '1s'}}>+</div>
      <div className="fixed top-1/2 right-1/4 text-purple-500/20 text-9xl -z-10 animate-float" style={{animationDelay: '0.5s'}}>-</div>
    </div>
  );
};

export default StartScreen;
