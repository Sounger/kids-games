import React, { useState, useEffect } from 'react';
import { QuizState, Difficulty } from './types';
import { generateQuiz } from './services/quizGenerator';
import Menu from './components/Menu';
import Loading from './components/Loading';
import Game from './components/Game';
import Results from './components/Results';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<QuizState>({
    status: 'menu',
    difficulty: Difficulty.EASY,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
  });

  const handleSelectDifficulty = async (difficulty: Difficulty) => {
    setGameState(prev => ({ ...prev, status: 'loading', difficulty }));

    try {
      const questions = await generateQuiz(difficulty);
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        questions,
        currentQuestionIndex: 0,
        score: 0
      }));
    } catch (error) {
      console.error(error);
      setGameState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: "Oops! Something went wrong. Please try again."
      }));
    }
  };

  const handleGameComplete = (finalScore: number) => {
    setGameState(prev => ({
      ...prev,
      status: 'results',
      score: finalScore
    }));
  };

  const handleRestart = () => {
    handleSelectDifficulty(gameState.difficulty);
  };

  const handleRetrySameQuiz = () => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      currentQuestionIndex: 0,
      score: 0
    }));
  };

  const handleHome = () => {
    setGameState(prev => ({ ...prev, status: 'menu', questions: [], score: 0 }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 font-sans selection:bg-blue-200">
        {/* Header/Nav - Simple branding sticky top */}
        <header className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-blue-100">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">#</div>
                 <span className="font-bold text-slate-700 tracking-tight hidden sm:block">Missing Number Genius</span>
             </div>
             {gameState.status === 'playing' && (
                 <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                     {gameState.difficulty}
                 </div>
             )}
        </header>

        <main className="pt-20 pb-10 px-4 max-w-6xl mx-auto">
            {gameState.status === 'menu' && (
                <Menu onSelectDifficulty={handleSelectDifficulty} />
            )}

            {gameState.status === 'loading' && (
                <Loading />
            )}

            {gameState.status === 'playing' && (
                <Game 
                    questions={gameState.questions} 
                    onComplete={handleGameComplete} 
                />
            )}

            {gameState.status === 'results' && (
                <Results 
                    score={gameState.score} 
                    total={gameState.questions.length} 
                    difficulty={gameState.difficulty}
                    onRestart={handleRestart}
                    onRetry={handleRetrySameQuiz}
                    onHome={handleHome}
                />
            )}

            {gameState.status === 'error' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                    <div className="text-6xl">😕</div>
                    <h3 className="text-xl font-bold text-red-500">Something went wrong</h3>
                    <p className="text-slate-500 max-w-md">{gameState.errorMessage}</p>
                    <button 
                        onClick={handleHome}
                        className="mt-4 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
                    >
                        Return Home
                    </button>
                </div>
            )}
        </main>
        
        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 p-2 text-center text-xs text-slate-300 pointer-events-none bg-gradient-to-t from-white to-transparent">
            Made for K3 🌟
        </footer>
    </div>
  );
};

export default App;