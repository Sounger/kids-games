
import React from 'react';
import { MathProblem } from '../types';
import { playSound } from '../services/soundService';

interface Props {
  problem: MathProblem;
  onAnswer: (correct: boolean) => void;
}

const MathModal: React.FC<Props> = ({ problem, onAnswer }) => {
  const handleAnswer = (correct: boolean) => {
    playSound(correct ? 'correct' : 'wrong');
    onAnswer(correct);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-1 rounded-lg shadow-2xl max-w-md w-full animate-float">
        <div className="bg-indigo-600 border-4 border-indigo-800 p-6 rounded text-center">
          
          <h2 className="text-gray-200 text-lg mb-4 uppercase tracking-widest">Security Check</h2>
          
          <div className="bg-black/40 p-6 mb-6 rounded border-2 border-indigo-400/30">
            <span className="text-5xl font-bold text-white tracking-widest font-mono">
              {problem.question}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {problem.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt === problem.answer)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-3xl font-bold py-4 px-6 rounded border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MathModal;
