import React from 'react';
import { FunStyle } from '../types';
import { FUN_STYLES } from '../constants';

interface StyleSelectorProps {
  onSelect: (style: FunStyle) => void;
  selectedId: string | null;
  disabled: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onSelect, selectedId, disabled }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-700">Pick a Magic Style! 👇</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {FUN_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            disabled={disabled}
            className={`
              relative group p-4 rounded-3xl border-2 border-black transition-all duration-200
              ${selectedId === style.id ? 'shadow-none translate-y-1 bg-gray-100 ring-4 ring-kid-blue' : 'shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] bg-white'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl border-2 border-black ${style.color}`}>
              {style.emoji}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">{style.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{style.description}</p>
            </div>
            {selectedId === style.id && (
               <div className="absolute -top-2 -right-2 bg-kid-blue text-white rounded-full p-1 border-2 border-black">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                 </svg>
               </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};