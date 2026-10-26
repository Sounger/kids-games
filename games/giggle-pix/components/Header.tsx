import React from 'react';
import { Wand2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-4 flex justify-center items-center mb-6">
      <div className="bg-white border-2 border-black shadow-comic rounded-full px-8 py-3 flex items-center gap-3 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
        <div className="bg-kid-yellow p-2 rounded-full border-2 border-black">
            <Wand2 size={24} className="text-black" />
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-kid-purple to-kid-pink tracking-tight">
          GigglePix
        </h1>
      </div>
    </header>
  );
};