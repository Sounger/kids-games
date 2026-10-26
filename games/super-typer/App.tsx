import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, WORDS_PER_GAME, SPEED_BONUS_THRESHOLD_MS } from './constants';
import { ScreenState, GameResult, WordCategory, GameMode } from './types';
import { Button } from './components/Button';
import { Trophy, Clock, Play, RotateCcw, User, Star, Zap, ArrowDown, ShieldAlert } from 'lucide-react';

// --- Helper: Shuffle Array ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Components defined within App to share state easily ---

// 1. Welcome Screen
const WelcomeScreen: React.FC<{ onStart: (name: string) => void }> = ({ onStart }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onStart(name.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="bg-white/20 backdrop-blur-lg p-8 rounded-[3rem] shadow-xl max-w-md w-full text-center border-4 border-white/30">
        <h1 className="text-5xl font-extrabold text-white mb-8 drop-shadow-md">
          Super Typer<br /><span className="text-yellow-300">Kids!</span> 🚀
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-6 h-6" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What's your name?"
              className="w-full pl-12 pr-6 py-4 rounded-2xl text-2xl font-bold text-indigo-900 placeholder-indigo-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all shadow-inner"
              maxLength={12}
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={!name.trim()} variant={name.trim() ? 'success' : 'secondary'}>
            Next
          </Button>
        </form>
      </div>
    </div>
  );
};

// 2. Mode Selection Screen
const ModeSelectScreen: React.FC<{ onSelect: (mode: GameMode) => void }> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md text-center">Choose Mode!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <button
          onClick={() => onSelect('classic')}
          className="bg-blue-400 hover:bg-blue-500 p-8 rounded-[2.5rem] shadow-xl transform transition-all hover:scale-105 active:scale-95 border-8 border-white/20 flex flex-col items-center text-white group"
        >
          <div className="bg-white/20 p-6 rounded-full mb-6 group-hover:rotate-12 transition-transform">
            <Zap className="w-16 h-16 fill-yellow-300 text-yellow-300" />
          </div>
          <h3 className="text-3xl font-black mb-2 uppercase">Classic Speed</h3>
          <p className="text-blue-100 text-lg font-bold text-center">Type fast for double points!</p>
        </button>

        <button
          onClick={() => onSelect('gravity')}
          className="bg-purple-500 hover:bg-purple-600 p-8 rounded-[2.5rem] shadow-xl transform transition-all hover:scale-105 active:scale-95 border-8 border-white/20 flex flex-col items-center text-white group"
        >
          <div className="bg-white/20 p-6 rounded-full mb-6 group-hover:translate-y-2 transition-transform">
            <ArrowDown className="w-16 h-16" />
          </div>
          <h3 className="text-3xl font-black mb-2 uppercase">Gravity Fall</h3>
          <p className="text-purple-200 text-lg font-bold text-center">Don't let the words fall!</p>
        </button>
      </div>
    </div>
  );
};

// 3. Category Selection
const CategoryScreen: React.FC<{ onSelect: (cat: WordCategory) => void }> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md text-center">Pick a Topic!</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`${cat.color} p-6 rounded-3xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 aspect-square border-4 border-white/20`}
          >
            <span className="text-6xl drop-shadow-sm">{cat.emoji}</span>
            <span className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-md">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 4. Game Screen (Wrapper for logic)
interface GameProps {
  category: WordCategory;
  onFinish: (score: number, totalTime: number) => void;
}

// 4a. Classic Mode Component
const ClassicGame: React.FC<GameProps> = ({ category, onFinish }) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [isError, setIsError] = useState(false);
  const [bonusActive, setBonusActive] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [wordStartTime, setWordStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWords(shuffleArray(category.words).slice(0, WORDS_PER_GAME));
    setWordStartTime(Date.now());
  }, [category]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  useEffect(() => {
    const focusInterval = setInterval(() => inputRef.current?.focus(), 100);
    return () => clearInterval(focusInterval);
  }, []);

  const currentWord = words[currentIndex] || '';

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    if (!currentWord.startsWith(val)) {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      return;
    }
    setInputValue(val);
    if (val === currentWord) handleWordComplete();
  };

  const handleWordComplete = () => {
    const now = Date.now();
    const isBonus = (now - wordStartTime) < SPEED_BONUS_THRESHOLD_MS;
    const points = isBonus ? 2 : 1;
    const newScore = score + points;
    
    setScore(newScore);
    if (currentIndex + 1 >= words.length) {
      onFinish(newScore, Math.floor((now - sessionStartTime) / 1000));
    } else {
      setCurrentIndex(prev => prev + 1);
      setInputValue('');
      setWordStartTime(now);
      setBonusActive(true);
    }
  };

  useEffect(() => {
    const bonusCheck = setInterval(() => {
      setBonusActive((Date.now() - wordStartTime) < SPEED_BONUS_THRESHOLD_MS);
    }, 100);
    return () => clearInterval(bonusCheck);
  }, [wordStartTime]);

  if (!words.length) return null;

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex justify-between w-full bg-white/20 backdrop-blur-md rounded-3xl p-4 text-white font-bold text-2xl shadow-lg border-2 border-white/30">
        <div className="flex items-center gap-2"><Clock className="w-8 h-8" /><span>{elapsedTime}s</span></div>
        <div className="flex items-center gap-2"><span>{currentIndex + 1} / {WORDS_PER_GAME}</span></div>
        <div className="flex items-center gap-2 text-yellow-300"><Star className="w-8 h-8 fill-current" /><span>{score}</span></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
        <div className={`relative bg-white rounded-[3rem] p-12 shadow-2xl border-b-8 border-indigo-200 w-full max-w-xl text-center transition-transform ${isError ? 'shake bg-red-50 border-red-200' : ''}`}>
          {bonusActive && (
            <div className="absolute -top-6 -right-6 z-10">
              <div className="bg-yellow-400 text-yellow-900 border-4 border-white text-base md:text-xl font-black px-6 py-3 rounded-full shadow-xl animate-spin-y uppercase tracking-widest">
                x2 Bonus! ⚡
              </div>
            </div>
          )}
          <div className="text-7xl md:text-8xl font-black text-indigo-900 tracking-wider mb-2 select-none">
            {currentWord.split('').map((char, idx) => (
              <span key={idx} className={`${idx < inputValue.length ? 'text-green-500' : 'text-slate-300'} ${idx === inputValue.length ? 'underline decoration-4 decoration-yellow-400 underline-offset-8' : ''}`}>
                {char}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-xl font-bold mt-4 uppercase tracking-widest">{category.label}</p>
        </div>
        <input ref={inputRef} type="text" value={inputValue} onChange={handleInput} className="opacity-0 absolute top-0 left-0 w-full h-full cursor-default" autoFocus />
        <div className="text-white/80 text-lg font-bold animate-pulse">Type the letters...</div>
      </div>
    </div>
  );
};

// 4b. Gravity Mode Component
const GravityGame: React.FC<GameProps> = ({ category, onFinish }) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [wordY, setWordY] = useState(0); // 0 to 100%
  const [sessionStartTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Refs for animation loop
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const wordYRef = useRef(0);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    setWords(shuffleArray(category.words).slice(0, WORDS_PER_GAME));
  }, [category]);

  const nextWord = useCallback((newScore: number) => {
    if (currentIndex + 1 >= WORDS_PER_GAME) {
      isGameOverRef.current = true;
      cancelAnimationFrame(requestRef.current);
      onFinish(newScore, Math.floor((Date.now() - sessionStartTime) / 1000));
    } else {
      setCurrentIndex(prev => prev + 1);
      setInputValue('');
      setWordY(0);
      wordYRef.current = 0;
    }
  }, [currentIndex, onFinish, sessionStartTime]);

  const animate = useCallback(() => {
    if (isGameOverRef.current) return;
    
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // 15 seconds to fall 100% -> speed = 100 / 15000 per ms
    const speed = 100 / 15000; 
    wordYRef.current += speed * dt;
    
    // Check collision with bottom (consider 90% as hit zone to account for word height)
    if (wordYRef.current >= 92) {
      // Word missed
      nextWord(score); // pass current score (no points added)
    } else {
      setWordY(wordYRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [nextWord, score]);

  useEffect(() => {
    lastTimeRef.current = Date.now();
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  useEffect(() => {
    const focusInterval = setInterval(() => inputRef.current?.focus(), 100);
    return () => clearInterval(focusInterval);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    const currentWord = words[currentIndex] || '';

    if (!currentWord.startsWith(val)) {
      // Penalty: Drop down faster (add 10% to position)
      wordYRef.current = Math.min(91, wordYRef.current + 10);
      setWordY(wordYRef.current);
      // Optional: Visual shake
      return;
    }

    setInputValue(val);

    // Correct letter logic: Jump up (remove 5% from position)
    if (val.length > inputValue.length) {
       wordYRef.current = Math.max(0, wordYRef.current - 5);
       setWordY(wordYRef.current);
    }

    if (val === currentWord) {
      setScore(prev => {
        const newScore = prev + 1;
        nextWord(newScore);
        return newScore;
      });
    }
  };

  if (!words.length) return null;
  const currentWord = words[currentIndex] || '';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900/10">
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between text-white font-bold text-2xl drop-shadow-md">
        <div className="bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm border-2 border-white/20">
            Level: {currentIndex + 1} / {WORDS_PER_GAME}
        </div>
        <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
           <Star className="fill-current" /> {score}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-red-600/80 to-transparent border-b-8 border-red-600 z-0 flex items-end justify-center pb-2">
         <div className="text-white/50 font-bold uppercase tracking-[1em] animate-pulse flex items-center gap-2">
             <ShieldAlert /> Danger Zone <ShieldAlert />
         </div>
      </div>

      {/* Falling Word */}
      <div 
        className="absolute left-0 w-full flex justify-center z-10 will-change-transform"
        style={{ top: `${wordY}%` }}
      >
        <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl border-4 border-indigo-200 transform -translate-y-full">
           <div className="text-6xl font-black text-indigo-900 tracking-wider">
            {currentWord.split('').map((char, idx) => (
              <span key={idx} className={`${idx < inputValue.length ? 'text-green-500' : 'text-slate-300'} ${idx === inputValue.length ? 'underline decoration-4 decoration-yellow-400 underline-offset-4' : ''}`}>
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      <input ref={inputRef} type="text" value={inputValue} onChange={handleInput} className="opacity-0 absolute inset-0 cursor-default" autoFocus />
    </div>
  );
};

// 5. Result & Leaderboard Screen
interface ResultScreenProps {
  currentResult: GameResult | null;
  history: GameResult[];
  onRestart: () => void;
  onHome: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ currentResult, history, onRestart, onHome }) => {
  const sortedHistory = [...history].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTime - b.totalTime;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
      {currentResult && (
        <div className="w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl mb-8 border-b-8 border-purple-200 text-center pop-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"></div>
          <h2 className="text-4xl md:text-5xl font-black text-purple-900 mb-6">Awesome, {currentResult.playerName}! 🎉</h2>
          <div className="flex justify-center items-center gap-2 mb-6">
             <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase text-sm tracking-wider">
               {currentResult.mode === 'classic' ? 'Classic Mode' : 'Gravity Mode'}
             </span>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
            <div className="bg-yellow-100 p-6 rounded-3xl flex flex-col items-center min-w-[160px]">
              <span className="text-yellow-600 font-bold uppercase text-sm mb-2">Score</span>
              <span className="text-6xl font-black text-yellow-500">{currentResult.score}</span>
            </div>
            <div className="bg-blue-100 p-6 rounded-3xl flex flex-col items-center min-w-[160px]">
              <span className="text-blue-600 font-bold uppercase text-sm mb-2">Time</span>
              <span className="text-6xl font-black text-blue-500">{currentResult.totalTime}s</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={onRestart} variant="success" size="lg" className="flex items-center gap-2"><RotateCcw /> Play Again</Button>
            <Button onClick={onHome} variant="secondary" size="lg" className="flex items-center gap-2"><User /> Switch User</Button>
          </div>
        </div>
      )}

      <div className="w-full bg-white/30 backdrop-blur-lg rounded-[2.5rem] p-8 shadow-xl border-4 border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-300 w-10 h-10 fill-yellow-300 drop-shadow-sm" />
          <h3 className="text-3xl font-black text-white drop-shadow-md">Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white border-b-2 border-white/30">
                <th className="p-4 font-bold text-lg">#</th>
                <th className="p-4 font-bold text-lg">Player</th>
                <th className="p-4 font-bold text-lg">Mode</th>
                <th className="p-4 font-bold text-lg">Category</th>
                <th className="p-4 font-bold text-lg text-center">Time</th>
                <th className="p-4 font-bold text-lg text-right">Score</th>
              </tr>
            </thead>
            <tbody className="text-indigo-900">
              {sortedHistory.map((res, idx) => (
                <tr key={res.timestamp} className="hover:bg-white/40 transition-colors rounded-lg group">
                  <td className="p-4 font-bold rounded-l-xl opacity-70 group-hover:opacity-100">{idx + 1}</td>
                  <td className="p-4 font-extrabold text-xl">{res.playerName}</td>
                  <td className="p-4 text-sm font-bold opacity-90">
                    {res.mode === 'classic' ? <Zap className="w-5 h-5 inline text-yellow-600" /> : <ArrowDown className="w-5 h-5 inline text-purple-600" />}
                  </td>
                  <td className="p-4 opacity-80">{res.categoryLabel}</td>
                  <td className="p-4 font-mono text-center font-bold">{res.totalTime}s</td>
                  <td className="p-4 text-right rounded-r-xl"><span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-sm">{res.score}</span></td>
                </tr>
              ))}
              {sortedHistory.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-white/60 font-bold text-xl italic">No games yet. Be the first!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Main App Container ---
const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  
  const [history, setHistory] = useState<GameResult[]>([]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setScreen('mode-select');
  };

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('category');
  };

  const handleCategorySelect = (cat: WordCategory) => {
    setSelectedCategory(cat);
    setScreen('game');
  };

  const handleGameFinish = (score: number, totalTime: number) => {
    if (!selectedCategory) return;
    const result: GameResult = {
      playerName,
      score,
      totalTime,
      timestamp: Date.now(),
      categoryLabel: selectedCategory.emoji + ' ' + selectedCategory.label,
      mode: gameMode
    };
    setLastResult(result);
    setHistory(prev => [...prev, result]);
    setScreen('result');
  };

  const handleRestart = () => {
    setScreen('category');
  };

  const handleHome = () => {
    setPlayerName('');
    setScreen('welcome');
  };

  return (
    <div className="antialiased selection:bg-pink-300 selection:text-pink-900">
      {screen === 'welcome' && <WelcomeScreen onStart={handleNameSubmit} />}
      {screen === 'mode-select' && <ModeSelectScreen onSelect={handleModeSelect} />}
      {screen === 'category' && <CategoryScreen onSelect={handleCategorySelect} />}
      {screen === 'game' && selectedCategory && (
        gameMode === 'classic' 
          ? <ClassicGame category={selectedCategory} onFinish={handleGameFinish} />
          : <GravityGame category={selectedCategory} onFinish={handleGameFinish} />
      )}
      {screen === 'result' && (
        <ResultScreen 
          currentResult={lastResult} 
          history={history} 
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  );
};

export default App;