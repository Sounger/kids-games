import React from 'react';
import { AVAILABLE_INSTRUMENTS } from '../constants';
import { ChevronDown } from 'lucide-react';

interface InstrumentSelectorProps {
  currentInstrumentId: string;
  onChange: (newId: string) => void;
  onDelete: () => void;
}

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  currentInstrumentId,
  onChange,
  onDelete
}) => {
  const currentInst = AVAILABLE_INSTRUMENTS.find(i => i.id === currentInstrumentId);

  return (
    <div className="relative group mr-2 sm:mr-4">
      <div className="flex items-center">
        <select
          value={currentInstrumentId}
          onChange={(e) => onChange(e.target.value)}
          className={`
            appearance-none 
            bg-gray-800 
            text-xs sm:text-sm 
            font-bold 
            text-white 
            py-2 px-3 pr-8 
            rounded-none 
            border-2 border-gray-600 
            hover:border-white 
            focus:outline-none 
            cursor-pointer
            w-32 sm:w-40
            uppercase
            truncate
          `}
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          <optgroup label="Drums">
            {AVAILABLE_INSTRUMENTS.filter(i => i.type === 'drum').map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </optgroup>
          <optgroup label="Instruments">
            {AVAILABLE_INSTRUMENTS.filter(i => i.type === 'instrument').map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </optgroup>
          <optgroup label="Effects">
            {AVAILABLE_INSTRUMENTS.filter(i => i.type === 'effect').map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </optgroup>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
          <ChevronDown size={16} />
        </div>
      </div>
      
      {/* Remove Row Button - appears on hover/focus nearby ideally, but for kids lets put it explicit */}
      <button 
        onClick={onDelete}
        className="hidden group-hover:block absolute -left-8 top-1 text-red-500 hover:text-red-400 font-bold px-1"
        title="Remove Track"
      >
        x
      </button>
    </div>
  );
};