import React from 'react';
import { Difficulty } from '../types';

interface MenuProps {
  onSelectDifficulty: (diff: Difficulty) => void;
}

const Menu: React.FC<MenuProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-6xl font-bold text-blue-600 drop-shadow-sm">
          Missing Number
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-orange-400">
          Genius
        </h2>
        <p className="text-slate-500 text-lg mt-4 max-w-md mx-auto">
          Can you find the hidden number? Choose a level to start your adventure!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
        <button
          onClick={() => onSelectDifficulty(Difficulty.EASY)}
          className="group relative p-8 bg-white rounded-3xl border-b-8 border-green-500 shadow-xl hover:-translate-y-2 transition-all duration-200 active:translate-y-0 active:border-b-0"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🌱</span>
          </div>
          <h3 className="text-3xl font-bold text-green-500 mb-2">Easy</h3>
          <p className="text-slate-400 font-medium">0 to 30</p>
          <p className="text-xs text-slate-300 mt-2">Perfect for beginners!</p>
        </button>

        <button
          onClick={() => onSelectDifficulty(Difficulty.MEDIUM)}
          className="group relative p-8 bg-white rounded-3xl border-b-8 border-yellow-400 shadow-xl hover:-translate-y-2 transition-all duration-200 active:translate-y-0 active:border-b-0"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🚀</span>
          </div>
          <h3 className="text-3xl font-bold text-yellow-500 mb-2">Medium</h3>
          <p className="text-slate-400 font-medium">30 to 50</p>
          <p className="text-xs text-slate-300 mt-2">Tricky patterns!</p>
        </button>

        <button
          onClick={() => onSelectDifficulty(Difficulty.HARD)}
          className="group relative p-8 bg-white rounded-3xl border-b-8 border-red-500 shadow-xl hover:-translate-y-2 transition-all duration-200 active:translate-y-0 active:border-b-0"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">👑</span>
          </div>
          <h3 className="text-3xl font-bold text-red-500 mb-2">Hard</h3>
          <p className="text-slate-400 font-medium">50 to 100</p>
          <p className="text-xs text-slate-300 mt-2">For math wizards!</p>
        </button>
      </div>
    </div>
  );
};

export default Menu;
