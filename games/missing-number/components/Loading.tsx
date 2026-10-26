import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative w-32 h-32">
        <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🤖</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-blue-600">Generating Quiz...</h2>
        <p className="text-slate-400">Our robot is building your number sequence!</p>
      </div>
    </div>
  );
};

export default Loading;
