import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Difficulty } from '../types';

interface ResultsProps {
  score: number;
  total: number;
  difficulty: Difficulty;
  onRestart: () => void;
  onRetry: () => void;
  onHome: () => void;
}

const Results: React.FC<ResultsProps> = ({ score, total, difficulty, onRestart, onRetry, onHome }) => {
  const percentage = (score / total) * 100;
  
  const data = [
    {
      name: 'Score',
      value: percentage,
      fill: percentage >= 80 ? '#4ade80' : percentage >= 50 ? '#facc15' : '#f87171',
    },
  ];

  let message = "";
  if (percentage === 100) message = "Perfect! You're a Genius! 🌟";
  else if (percentage >= 80) message = "Great Job! Keep it up! 🚀";
  else if (percentage >= 50) message = "Good try! You're getting there! 👍";
  else message = "Keep practicing, you can do it! 💪";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 w-full border-b-8 border-blue-100 flex flex-col items-center">
        <h2 className="text-4xl font-bold text-slate-700 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 font-medium mb-8">Level: {difficulty}</p>

        <div className="h-64 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="70%" 
              outerRadius="100%" 
              barSize={20} 
              data={data} 
              startAngle={90} 
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-6xl font-bold text-slate-800">{score}/{total}</span>
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Score</span>
          </div>
        </div>

        <p className="text-xl font-bold text-center text-blue-600 mt-6 mb-8">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onHome}
            className="flex-1 py-4 px-2 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Menu
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-4 px-2 rounded-xl font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 transition-colors border-b-4 border-orange-200 active:border-b-0 active:translate-y-1"
          >
            Retry Quiz
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-4 px-2 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-blue-700 active:translate-y-0 active:border-b-0"
          >
            New Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;