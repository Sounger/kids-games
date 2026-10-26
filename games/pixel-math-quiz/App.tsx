import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, BarChart3, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Question, Player, GameState } from './types';
import { generateQuiz } from './utils/mathGenerator';
import { RetroButton } from './components/RetroButton';
import { Modal } from './components/Modal';
import { SoundEffects } from './utils/soundEffects';

// ----------------------------------------------------------------------
// Sub-components defined here for simplicity and file limit adherence
// ----------------------------------------------------------------------

const QuestionTile: React.FC<{
  question: Question;
  isShaking: boolean;
  onClick: (q: Question) => void;
}> = ({ question, isShaking, onClick }) => {
  const getColors = () => {
    if (isShaking) return 'bg-red-500 border-red-800 text-white animate-shake z-10';
    if (question.isSolved) return 'bg-retro-gray border-gray-500 text-gray-400 cursor-not-allowed';
    switch (question.difficulty) {
      case 'easy': return 'bg-retro-yellow hover:brightness-110 text-black border-black';
      case 'medium': return 'bg-retro-blue hover:brightness-110 text-white border-black';
      case 'hard': return 'bg-retro-green hover:brightness-110 text-black border-black';
      default: return 'bg-white';
    }
  };

  return (
    <button
      onClick={() => {
        if (!question.isSolved) {
            SoundEffects.selectTile();
            onClick(question);
        }
      }}
      onMouseEnter={() => !question.isSolved && SoundEffects.hover()}
      disabled={question.isSolved}
      className={`
        relative w-full aspect-square md:aspect-[4/3] flex flex-col items-center justify-center 
        border-2 md:border-b-4 md:border-r-4 rounded-lg 
        transition-all duration-100 active:border-b-2 active:border-r-2 active:translate-x-[2px] active:translate-y-[2px]
        ${getColors()}
      `}
    >
      {question.isSolved ? (
        <CheckCircle2 className="w-8 h-8 opacity-50" />
      ) : (
        <>
          <span className="text-xl md:text-2xl font-black">?</span>
          <span className="text-xs font-bold uppercase mt-1">
            {question.points} {question.points === 1 ? 'Pt' : 'Pts'}
          </span>
        </>
      )}
    </button>
  );
};

// ----------------------------------------------------------------------
// Main App Component
// ----------------------------------------------------------------------

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Record<string, number>>({});
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [solvedQuestionBuffer, setSolvedQuestionBuffer] = useState<Question | null>(null);
  const [winnerName, setWinnerName] = useState('');
  const [shakingId, setShakingId] = useState<number | null>(null);
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);

  // Initial load
  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    setQuestions(generateQuiz());
    setPlayers({});
    setGameState(GameState.IDLE);
    setCurrentQuestion(null);
    setSolvedQuestionBuffer(null);
    setShakingId(null);
  };

  const handleTileClick = (q: Question) => {
    setCurrentQuestion(q);
    setGameState(GameState.VIEWING_QUESTION);
  };

  const handleAnswer = (selectedOption: number) => {
    if (!currentQuestion) return;

    if (selectedOption === currentQuestion.correctAnswer) {
      // Correct!
      SoundEffects.correct();
      setSolvedQuestionBuffer(currentQuestion);
      // Mark as solved in the grid immediately for visual feedback
      setQuestions(prev => prev.map(q => q.id === currentQuestion.id ? { ...q, isSolved: true } : q));
      setGameState(GameState.NAMING_WINNER);
    } else {
      // Incorrect
      SoundEffects.wrong();
      const idToShake = currentQuestion.id;
      setShakingId(idToShake);
      setGameState(GameState.IDLE);
      // Reset shake after animation duration (500ms)
      setTimeout(() => setShakingId(null), 500);
    }
    setCurrentQuestion(null);
  };

  const submitWinnerName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerName.trim() || !solvedQuestionBuffer) return;

    SoundEffects.scoreUp();
    const name = winnerName.trim().toUpperCase();
    
    setPlayers(prev => ({
      ...prev,
      [name]: (prev[name] || 0) + solvedQuestionBuffer.points
    }));

    setWinnerName('');
    setSolvedQuestionBuffer(null);
    setGameState(GameState.IDLE);
  };

  const totalPoints = Object.values(players).reduce((acc, curr) => acc + curr, 0);
  
  // Animate score when it changes
  useEffect(() => {
    if (totalPoints > 0) {
      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalPoints]);

  const solvedCount = questions.filter(q => q.isSolved).length;
  const isRoundOver = solvedCount === 40;

  // Sorting leaderboard
  const sortedPlayers = Object.entries(players)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([name, score]) => ({ name, score }));

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col font-sans text-retro-dark">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-md">
                <Trophy size={32} />
            </div>
            <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Pixel Math</h1>
                <p className="text-sm font-bold text-gray-500">Collect points to win</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
             <div className={`
                bg-white border-2 border-black shadow-retro-sm px-4 py-2 rounded-lg flex flex-col items-center 
                transition-all duration-300 cursor-default
                hover:scale-105 hover:shadow-[0_0_15px_rgba(96,165,250,0.6)]
                ${isScoreAnimating ? 'scale-125 ring-4 ring-retro-yellow/50 bg-yellow-50' : ''}
             `}>
                <span className="text-xs font-bold text-gray-500 uppercase">Total Score</span>
                <span className="text-2xl font-black">{totalPoints}</span>
             </div>
             <RetroButton onClick={() => setGameState(GameState.VIEWING_STATS)} variant="neutral" className="flex items-center gap-2">
                <BarChart3 size={20} />
                <span className="hidden md:inline">Leaderboard</span>
             </RetroButton>
        </div>
      </header>

      {/* Grid - Responsive Logic: 4 cols mobile, 5 cols tablet, 10 cols desktop */}
      <main className="flex-1">
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2 md:gap-3 lg:gap-4">
          {questions.map((q) => (
            <QuestionTile 
              key={q.id} 
              question={q} 
              isShaking={shakingId === q.id} 
              onClick={handleTileClick} 
            />
          ))}
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="mt-8 text-center text-sm font-bold text-gray-500 flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-retro-yellow border border-black rounded-sm"></div>
            <span>Easy (1 Pt)</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-retro-blue border border-black rounded-sm"></div>
            <span>Medium (2 Pts)</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-retro-green border border-black rounded-sm"></div>
            <span>Hard (3 Pts)</span>
        </div>
      </footer>


      {/* --- Modals --- */}

      {/* Question Modal */}
      <Modal 
        isOpen={gameState === GameState.VIEWING_QUESTION && !!currentQuestion} 
        onClose={() => setGameState(GameState.IDLE)}
        title={`Question #${currentQuestion?.id}`}
      >
        {currentQuestion && (
          <div className="flex flex-col items-center">
            <div className="w-full bg-gray-100 border-2 border-dashed border-gray-300 p-8 mb-8 rounded-xl flex items-center justify-center">
              <span className="text-4xl md:text-6xl font-black text-center">{currentQuestion.text}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onMouseEnter={() => SoundEffects.hover()}
                  onClick={() => handleAnswer(option)}
                  className="group relative p-4 border-2 border-black rounded-xl bg-white hover:bg-black hover:text-white transition-all shadow-retro-sm active:translate-y-1 active:shadow-none"
                >
                  <span className="text-2xl font-bold">{option}</span>
                </button>
              ))}
            </div>
            <p className="mt-6 text-gray-400 text-sm font-medium italic">Select the correct answer to win {currentQuestion.points} points.</p>
          </div>
        )}
      </Modal>

      {/* Winner Name Modal */}
      <Modal 
        isOpen={gameState === GameState.NAMING_WINNER} 
        // Prevent closing by clicking outside to ensure name is entered, or allow closing to discard points? 
        // Game flow suggests we must capture the name. But let's allow close if nobody claims it (rare edge case).
        onClose={() => setGameState(GameState.IDLE)}
        title="Correct Answer!"
      >
        <div className="text-center">
            <div className="mb-6 flex justify-center">
                <div className="bg-green-100 p-4 rounded-full border-2 border-green-500 text-green-600">
                    <CheckCircle2 size={48} />
                </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Great Job!</h3>
            <p className="text-gray-600 mb-6">Who answered this question correctly?</p>
            
            <form onSubmit={submitWinnerName} className="flex flex-col gap-4">
                <input
                    autoFocus
                    type="text"
                    value={winnerName}
                    onChange={(e) => setWinnerName(e.target.value)}
                    placeholder="Enter Player Name"
                    className="w-full text-center text-xl font-bold p-4 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-retro-yellow/50 uppercase placeholder:normal-case"
                    required
                />
                <RetroButton type="submit" variant="success" className="w-full">
                    Confirm & Add {solvedQuestionBuffer?.points} Points
                </RetroButton>
            </form>
            
            {/* List existing players for quick select? Optional, stick to simple input for now as per prompt. */}
            {sortedPlayers.length > 0 && (
                <div className="mt-6 border-t pt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Quick Select</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {sortedPlayers.map(p => (
                            <button
                                key={p.name}
                                type="button"
                                onMouseEnter={() => SoundEffects.hover()}
                                onClick={() => {
                                    SoundEffects.click();
                                    setWinnerName(p.name);
                                }}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-sm font-bold transition-colors"
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </Modal>

      {/* Leaderboard / Stats Modal */}
      <Modal 
        isOpen={gameState === GameState.VIEWING_STATS || isRoundOver && gameState !== GameState.NAMING_WINNER} 
        onClose={() => setGameState(GameState.IDLE)}
        title="Leaderboard"
      >
        <div className="flex flex-col gap-6">
            {sortedPlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No scores yet. Start playing!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedPlayers.map((player, index) => (
                        <div key={player.name} className="flex items-center justify-between p-4 bg-gray-50 border-b-2 border-gray-200 last:border-0 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-8 h-8 flex items-center justify-center font-black rounded-full text-white
                                    ${index === 0 ? 'bg-yellow-500 shadow-md scale-110' : 
                                      index === 1 ? 'bg-gray-400' : 
                                      index === 2 ? 'bg-orange-400' : 'bg-slate-800'}
                                `}>
                                    {index + 1}
                                </div>
                                <span className="text-lg font-bold">{player.name}</span>
                            </div>
                            <span className="text-2xl font-black">{player.score} <span className="text-sm font-medium text-gray-400">pts</span></span>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-center text-gray-500 mb-2">Game Management</p>
                    <RetroButton onClick={startNewRound} variant="danger" className="w-full flex items-center justify-center gap-2">
                        <RefreshCw size={18} />
                        Reset Round & Clear Scores
                    </RetroButton>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
