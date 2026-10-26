
import React, { useState } from 'react';
import { Player } from '../types';
import { Dices, ArrowDown } from 'lucide-react';

interface PlayerControlsProps {
  currentPlayer: Player;
  onRoll: (value: number) => void;
  disabled: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ currentPlayer, onRoll, disabled }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [lastLocalRoll, setLastLocalRoll] = useState<number | null>(null);

  const rollDice = () => {
    if (isRolling || disabled) return;
    
    setIsRolling(true);
    setLastLocalRoll(null);

    const interval = setInterval(() => {
      setLastLocalRoll(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalRoll = Math.floor(Math.random() * 6) + 1;
      setLastLocalRoll(finalRoll);
      setIsRolling(false);
      onRoll(finalRoll);
    }, 800);
  };

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-xl p-4 md:p-5 border-4 transition-colors duration-500 flex flex-col items-center gap-3 relative"
      style={{ borderColor: currentPlayer.color }}
    >
      {/* Turn Indicator */}
      {!disabled && !isRolling && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center pointer-events-none">
          <p className="text-white px-5 py-1.5 rounded-full font-game text-sm shadow-lg uppercase tracking-wider" style={{ backgroundColor: currentPlayer.color }}>
            {currentPlayer.name}'s TURN!
          </p>
          <ArrowDown className="w-6 h-6" style={{ color: currentPlayer.color }} />
        </div>
      )}

      <div className="flex items-center gap-3 w-full justify-center">
         <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-gray-50 border-2" style={{ borderColor: currentPlayer.color + '44' }}>
           <span className="text-4xl animate-pulse">{currentPlayer.animal}</span>
           <p className="text-xl font-game text-gray-800 truncate max-w-[180px]">{currentPlayer.name}</p>
         </div>
      </div>

      <div className="flex items-center justify-center w-full gap-4">
        <div 
          className={`
            w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 bg-white shadow-inner flex items-center justify-center text-4xl font-game
            ${isRolling ? 'animate-bounce text-gray-300 border-gray-200' : 'text-gray-800'}
          `}
          style={{ borderColor: isRolling ? undefined : currentPlayer.color }}
        >
          {lastLocalRoll || '?'}
        </div>

        <button
          onClick={rollDice}
          disabled={isRolling || disabled}
          className={`
            flex-1 py-4 px-8 rounded-2xl font-game text-xl md:text-2xl flex items-center justify-center gap-3 transition-all
            ${isRolling || disabled 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'text-white shadow-lg active:shadow-none hover:translate-y-[2px] active:translate-y-[6px]'}
          `}
          style={{ 
            backgroundColor: isRolling || disabled ? undefined : currentPlayer.color,
            boxShadow: isRolling || disabled ? undefined : `0 8px 0 ${currentPlayer.color}99`
          }}
        >
          <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
          {isRolling ? 'ROLLING...' : 'ROLL DICE'}
        </button>
      </div>

      {currentPlayer.isSkippingTurn && (
        <p className="text-red-500 font-bold text-xs px-3 py-1 rounded-full bg-red-50 border-2 border-red-200 animate-pulse">
          Wait! Skipping this turn...
        </p>
      )}
    </div>
  );
};

export default PlayerControls;
