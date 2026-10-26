
import React, { useState, useCallback } from 'react';
import { GameState, Player, Space } from './types';
import { BOARD_SPACES, ANIMALS } from './constants';
import GameBoard from './components/GameBoard';
import PlayerControls from './components/PlayerControls';
import ActionModal from './components/ActionModal';
import PlayerSetup from './components/PlayerSetup';
import { Trophy, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    players: ANIMALS.map((animal, idx) => ({
      id: idx,
      name: animal.name,
      animal: animal.emoji,
      color: animal.color,
      position: 0,
      isSkippingTurn: false,
    })),
    currentPlayerIndex: 0,
    isGameOver: false,
    winner: null,
    lastDiceRoll: null,
    currentAction: null,
  });

  const startGame = (names: string[]) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map((p, i) => ({ ...p, name: names[i] || p.name }))
    }));
    setGameStarted(true);
  };

  const handleRoll = (rollValue: number) => {
    if (gameState.isGameOver || gameState.currentAction) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.isSkippingTurn) {
      setGameState(prev => {
        const nextPlayers = [...prev.players];
        nextPlayers[prev.currentPlayerIndex].isSkippingTurn = false;
        return {
          ...prev,
          players: nextPlayers,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          lastDiceRoll: null,
        };
      });
      return;
    }

    const newPosition = Math.min(currentPlayer.position + rollValue, BOARD_SPACES.length - 1);
    const landingSpace = BOARD_SPACES[newPosition];

    setGameState(prev => {
      const nextPlayers = [...prev.players];
      nextPlayers[prev.currentPlayerIndex].position = newPosition;
      
      const nextAction = landingSpace.type !== 'NONE' ? landingSpace : null;

      return {
        ...prev,
        players: nextPlayers,
        lastDiceRoll: rollValue,
        currentAction: nextAction,
        // Если задания нет, сразу передаем ход следующему
        currentPlayerIndex: nextAction ? prev.currentPlayerIndex : (prev.currentPlayerIndex + 1) % prev.players.length,
      };
    });
  };

  const closeActionModal = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentAction) return prev;

      let nextPosition = prev.players[prev.currentPlayerIndex].position;
      let nextIsSkipping = false;
      let nextIsGameOver = false;
      let nextWinner = null;

      const nextPlayers = [...prev.players];
      const currentAction = prev.currentAction;

      if (currentAction.type === 'FORWARD' && currentAction.value) {
        nextPosition = Math.min(nextPosition + currentAction.value, BOARD_SPACES.length - 1);
      } else if (currentAction.type === 'BACK' && currentAction.value) {
        nextPosition = Math.max(nextPosition - currentAction.value, 0);
      } else if (currentAction.type === 'LOSE_TURN') {
        nextIsSkipping = true;
      } else if (currentAction.type === 'FINISH') {
        nextIsGameOver = true;
        nextWinner = prev.players[prev.currentPlayerIndex];
      }

      nextPlayers[prev.currentPlayerIndex].position = nextPosition;
      nextPlayers[prev.currentPlayerIndex].isSkippingTurn = nextIsSkipping;

      return {
        ...prev,
        players: nextPlayers,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        currentAction: null,
        isGameOver: nextIsGameOver,
        winner: nextWinner,
      };
    });
  }, []);

  const resetGame = () => {
    setGameStarted(false);
    setGameState({
      players: ANIMALS.map((animal, idx) => ({
        id: idx,
        name: animal.name,
        animal: animal.emoji,
        color: animal.color,
        position: 0,
        isSkippingTurn: false,
      })),
      currentPlayerIndex: 0,
      isGameOver: false,
      winner: null,
      lastDiceRoll: null,
      currentAction: null,
    });
  };

  if (!gameStarted) {
    return <PlayerSetup onStart={startGame} />;
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="h-screen w-full flex flex-col items-center justify-start overflow-hidden relative">
      <header className="w-full text-center shrink-0 py-0.5 z-10 bg-white/10 backdrop-blur-sm">
        <h1 className="text-sm md:text-base font-game text-green-800 flex items-center justify-center gap-2">
          MAGIC FOREST
        </h1>
      </header>

      <main className="w-full flex-grow overflow-hidden relative">
        <div className="hidden lg:flex flex-col gap-1 w-32 absolute right-2 top-2 z-10 pointer-events-none">
          {gameState.players.map((p, idx) => (
            <div 
              key={p.id}
              className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all bg-white/80 backdrop-blur-sm ${
                gameState.currentPlayerIndex === idx 
                  ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-md scale-105' 
                  : 'border-transparent opacity-50'
              }`}
            >
              <span className="text-lg">{p.animal}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-gray-800 truncate leading-none">{p.name}</p>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-green-400" style={{ width: `${(p.position / 49) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-full">
           <GameBoard players={gameState.players} currentPlayerIndex={gameState.currentPlayerIndex} />
        </div>
      </main>

      <div className="w-full max-w-lg px-2 py-1 shrink-0 z-20">
        {!gameState.isGameOver && (
          <PlayerControls 
            currentPlayer={currentPlayer} 
            onRoll={handleRoll} 
            disabled={!!gameState.currentAction}
          />
        )}
      </div>

      {gameState.currentAction && (
        <ActionModal 
          space={gameState.currentAction} 
          player={gameState.players[gameState.currentPlayerIndex]}
          onClose={closeActionModal}
        />
      )}

      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] p-10 max-w-sm w-full text-center shadow-2xl border-[12px] border-yellow-400">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-4xl font-game text-yellow-600 mb-2">HERO!</h2>
            <div className="text-7xl mb-4 drop-shadow-lg">{gameState.winner?.animal}</div>
            <p className="text-2xl font-bold text-gray-800 mb-8">
              {gameState.winner?.name} won!
            </p>
            <button 
              onClick={resetGame}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-game text-2xl py-4 px-10 rounded-full shadow-[0_8px_0_rgb(22,163,74)] active:translate-y-[4px] active:shadow-none"
            >
              RESTART
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
