
import React, { useState, useEffect } from 'react';
import { GameState, DifficultyRange, MathOperation, SessionStats } from './types';
import StartScreen from './components/StartScreen';
import GameLoop from './components/GameLoop';
import StatsScreen from './components/StatsScreen';
import { playSound, playMusic, initAudio } from './services/soundService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [playerName, setPlayerName] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyRange>('1-10');
  const [operation, setOperation] = useState<MathOperation>('ADDITION');
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);
  const [lastSession, setLastSession] = useState<SessionStats | null>(null);

  // Manage Music based on State
  useEffect(() => {
    const handleUserInteraction = () => {
        initAudio();
        // Remove listener after first interaction
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'MENU' || gameState === 'STATS') {
      playMusic('MENU');
    } else if (gameState === 'PLAYING') {
      playMusic('GAME');
    } else {
      playMusic(null); // Stop music on Game Over / Victory (let SFX play)
    }
  }, [gameState]);

  const handleStartGame = (name: string, diff: DifficultyRange, op: MathOperation, quickMode: boolean) => {
    setPlayerName(name);
    setDifficulty(diff);
    setOperation(op);
    setIsQuickMode(quickMode);
    setGameState('PLAYING');
  };

  const handleGameOver = (sessionData: SessionStats) => {
    setLastSession(sessionData);
    setGameState(sessionData.won ? 'VICTORY' : 'GAME_OVER');
    playSound(sessionData.won ? 'win' : 'lose');
  };

  const handleBackToMenu = () => {
    setGameState('MENU');
  };

  const handleViewStats = () => {
    setGameState('STATS');
  }

  return (
    <div className="w-full h-screen bg-neutral-900 text-white flex flex-col items-center justify-center overflow-hidden font-pixel">
      {gameState === 'MENU' && (
        <StartScreen 
          onStart={handleStartGame} 
          initialName={playerName}
          onViewStats={handleViewStats}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameLoop
          playerName={playerName}
          difficulty={difficulty}
          operation={operation}
          isQuickMode={isQuickMode}
          onEnd={handleGameOver}
        />
      )}

      {(gameState === 'GAME_OVER' || gameState === 'VICTORY' || gameState === 'STATS') && (
        <StatsScreen
          gameState={gameState}
          session={lastSession}
          playerName={playerName}
          onBack={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default App;
