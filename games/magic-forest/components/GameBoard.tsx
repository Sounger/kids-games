
import React from 'react';
import { Player } from '../types';
import { BOARD_SPACES } from '../constants';

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ players, currentPlayerIndex }) => {
  const COLS = 8;
  const TILE_SIZE = 150;
  const GAP = 4;
  const PADDING = 5;

  const getPosition = (index: number) => {
    const row = Math.floor(index / COLS);
    const colInRow = index % COLS;
    const col = row % 2 === 0 ? colInRow : COLS - 1 - colInRow;
    
    const totalRows = Math.ceil(BOARD_SPACES.length / COLS);
    const reversedRow = totalRows - 1 - row;

    return {
      x: PADDING + col * (TILE_SIZE + GAP),
      y: PADDING + reversedRow * (TILE_SIZE + GAP),
    };
  };

  const totalRows = Math.ceil(BOARD_SPACES.length / COLS);
  const width = PADDING * 2 + COLS * TILE_SIZE + (COLS - 1) * GAP;
  const height = PADDING * 2 + totalRows * TILE_SIZE + (totalRows - 1) * GAP;

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center p-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full select-none touch-none drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="tile-shadow">
            <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.15" />
          </filter>
          <filter id="active-glow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
            <feFlood floodColor="gold" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="tile-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f7fee7', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="special-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {BOARD_SPACES.map((space, idx) => {
          const { x, y } = getPosition(idx);
          const isSpecial = space.type !== 'NONE';
          const isFinish = space.type === 'FINISH';
          const isStart = idx === 0;

          return (
            <g key={space.id} transform={`translate(${x}, ${y})`}>
              <rect
                width={TILE_SIZE}
                height={TILE_SIZE}
                rx={32}
                className={`
                  ${isStart ? 'fill-blue-500' : ''}
                  ${isFinish ? 'fill-yellow-400' : ''}
                  ${!isStart && !isFinish && isSpecial ? 'fill-[url(#special-grad)]' : 'fill-[url(#tile-grad)]'}
                  stroke-[4px] ${isSpecial ? 'stroke-purple-700' : 'stroke-white'}
                `}
                filter="url(#tile-shadow)"
              />
              
              {isFinish ? (
                <g transform={`translate(${TILE_SIZE/2}, ${TILE_SIZE/2})`}>
                  <text fontSize="80" textAnchor="middle" dy=".35em">💰</text>
                </g>
              ) : isStart ? (
                <text x={TILE_SIZE/2} y={TILE_SIZE/2 + 15} fontSize="32" textAnchor="middle" fontWeight="bold" fill="white" className="font-game">GO!</text>
              ) : (
                <>
                   <text 
                    x={TILE_SIZE/2} 
                    y={TILE_SIZE/2 + 10} 
                    fontSize="64" 
                    textAnchor="middle" 
                    className={`font-game pointer-events-none ${isSpecial ? 'fill-white' : 'fill-green-900/10'}`}
                  >
                    {space.label}
                  </text>
                  {isSpecial && (
                    <text x={TILE_SIZE-25} y={35} fontSize="36" textAnchor="middle" className="animate-pulse">⭐</text>
                  )}
                </>
              )}
            </g>
          );
        })}

        {BOARD_SPACES.map((_, idx) => {
          if (idx === BOARD_SPACES.length - 1) return null;
          const start = getPosition(idx);
          const end = getPosition(idx + 1);
          return (
            <line 
              key={`line-${idx}`}
              x1={start.x + TILE_SIZE/2} 
              y1={start.y + TILE_SIZE/2}
              x2={end.x + TILE_SIZE/2} 
              y2={end.y + TILE_SIZE/2}
              stroke="white"
              strokeWidth="10"
              strokeDasharray="16 16"
              strokeLinecap="round"
              className="opacity-40"
            />
          );
        })}

        {players.map((player, idx) => {
          const { x, y } = getPosition(player.position);
          const isActive = idx === currentPlayerIndex;
          const offsetX = (idx % 3) * 35 - 35;
          const offsetY = Math.floor(idx / 3) * 35 - 18;

          return (
            <g 
              key={player.id} 
              className={`transition-all duration-1000 ease-in-out ${isActive ? 'z-50' : ''}`}
              transform={`translate(${x + TILE_SIZE/2 + offsetX}, ${y + TILE_SIZE/2 + offsetY})`}
            >
              {isActive && (
                <circle r="50" fill="gold" className="opacity-40 animate-ping" />
              )}
              <circle 
                r="42" 
                fill="white" 
                stroke={isActive ? 'gold' : player.color} 
                strokeWidth={isActive ? '8' : '5'} 
                className="filter drop-shadow-xl" 
              />
              <text 
                fontSize="55" 
                textAnchor="middle" 
                dy=".35em"
                className="cursor-default"
              >
                {player.animal}
              </text>
              {isActive && (
                <path d="M-10,-60 L0,-45 L10,-60" fill="gold" className="animate-bounce" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GameBoard;
