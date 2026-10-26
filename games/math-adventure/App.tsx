import React, { useState, useEffect, useCallback } from 'react';
import { GameState, MathProblem } from './types';
import { generateMathProblem, generateIllustration } from './services/storyGenerator';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { Loader2, Star, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';

const THEMES = [
  'Space Adventure', 'Dinosaurs', 'Magic School', 'Deep Ocean', 
  'Superheroes', 'Tiny Insects', 'Sports Day', 'Fairies & Elves', 
  'Construction Site', 'Funny Monsters', 'Pirates', 'Jungle Animals', 
  'Robots', 'Knights & Dragons', 'Farm Animals', 'Candy Land', 
  'Toy Store', 'Zoo', 'Camping', 'Birthday Party'
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Track how many problems have been loaded to determine difficulty
  const [problemCount, setProblemCount] = useState(0);

  const loadNewProblem = useCallback(async () => {
    setGameState(GameState.LOADING);
    setProblem(null);
    setImageUrl(null);
    setSelectedAnswer(null);
    setErrorMsg('');

    // Logic: Every 3rd problem is mixed (add AND subtract).
    // Count: 0(simple), 1(simple), 2(mixed), 3(simple), 4(simple), 5(mixed)...
    const isMixed = (problemCount + 1) % 3 === 0;

    // Select a random theme
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];

    try {
      // 1. Generate text problem with the specific theme
      const mathProblem = await generateMathProblem(isMixed, randomTheme);
      setProblem(mathProblem);

      // Increment count only on success so we don't skip logic on error
      setProblemCount(prev => prev + 1);

      // 2. Generate image based on description
      const base64Image = await generateIllustration(mathProblem.imageDescription);
      setImageUrl(base64Image);
      
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setErrorMsg("Oops! Something went wrong getting the problem. Let's try again!");
      setGameState(GameState.ERROR);
    }
  }, [problemCount]);

  const handleAnswer = (answer: number) => {
    if (!problem) return;
    
    setSelectedAnswer(answer);
    
    if (answer === problem.correctAnswer) {
      setScore(s => s + 1);
      setGameState(GameState.SUCCESS);
    } else {
      // Simple shake effect logic could go here, or just UI state
    }
  };

  // -- RENDER HELPERS --

  const renderStartScreen = () => (
    <div className="p-8 text-center space-y-8">
      <div className="flex justify-center mb-4">
        <div className="bg-yellow-400 p-4 rounded-full text-white shadow-lg">
          <Star size={64} fill="currentColor" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-tight">
        Math Adventure
      </h1>
      <p className="text-xl text-gray-600">
        Solve fun math stories and see magic pictures!
      </p>
      <div className="pt-8">
        <Button size="lg" onClick={loadNewProblem}>
          Start Playing!
        </Button>
      </div>
    </div>
  );

  const renderLoadingScreen = () => (
    <div className="p-12 flex flex-col items-center justify-center space-y-6 h-96">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
        <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </div>
      <p className="text-2xl font-bold text-blue-500 animate-pulse text-center">
        Dreaming up a new story...
      </p>
      <p className="text-gray-400 text-sm">Getting your picture ready</p>
    </div>
  );

  const renderErrorScreen = () => (
    <div className="p-8 text-center space-y-6">
      <XCircle className="w-20 h-20 text-red-400 mx-auto" />
      <h2 className="text-2xl font-bold text-gray-700">Oh no!</h2>
      <p className="text-gray-500">{errorMsg}</p>
      <Button onClick={loadNewProblem} variant="secondary">
        Try Again
      </Button>
    </div>
  );

  const renderGameScreen = () => {
    if (!problem) return null;

    const isSuccess = gameState === GameState.SUCCESS;

    return (
      <div className="flex flex-col h-full">
        {/* Header / Score */}
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center shadow-md z-10">
          <span className="font-bold text-lg flex items-center gap-2">
            <Star fill="currentColor" className="text-yellow-300" /> 
            Score: {score}
          </span>
          <button onClick={loadNewProblem} className="p-2 hover:bg-blue-600 rounded-full transition-colors" title="Skip">
             <RefreshCcw size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32">
          
          {/* Image Area */}
          <div className="w-full aspect-square md:aspect-video bg-gray-100 rounded-3xl overflow-hidden shadow-inner border-2 border-gray-100 relative group">
             {imageUrl ? (
               <img 
                 src={imageUrl} 
                 alt="Math problem illustration" 
                 className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-300">
                 <Loader2 className="animate-spin" />
               </div>
             )}
          </div>

          {/* Question Text */}
          <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-200">
             <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight text-center">
               {problem.question}
             </p>
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {problem.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === problem.correctAnswer;
              
              let variant: 'secondary' | 'success' | 'danger' = 'secondary';
              
              if (isSelected) {
                if (isCorrect || isSuccess) variant = 'success';
                else variant = 'danger';
              } else if (isSuccess && isCorrect) {
                variant = 'success';
              }

              return (
                <Button 
                  key={idx} 
                  size="lg" 
                  variant={variant}
                  onClick={() => !isSuccess && handleAnswer(option)}
                  disabled={isSuccess}
                  className="text-4xl h-24"
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Success Overlay / Next Button */}
        {isSuccess && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
             <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6 border-4 border-green-200 transform scale-100 md:scale-110">
               <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto animate-bounce" />
               <h2 className="text-4xl font-extrabold text-green-600">Great Job!</h2>
               <p className="text-xl text-gray-600">You solved it correctly.</p>
               <Button size="lg" variant="success" onClick={loadNewProblem}>
                 Next Problem →
               </Button>
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {gameState === GameState.START && renderStartScreen()}
      {gameState === GameState.LOADING && renderLoadingScreen()}
      {gameState === GameState.ERROR && renderErrorScreen()}
      {(gameState === GameState.PLAYING || gameState === GameState.SUCCESS) && renderGameScreen()}
    </Layout>
  );
};

export default App;