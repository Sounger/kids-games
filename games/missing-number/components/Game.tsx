import React, { useState } from 'react';
import { QuizQuestion, QuizOption } from '../types';

interface GameProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Game: React.FC<GameProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (optionIndex: number) => {
    if (showFeedback) return; // Prevent clicking during feedback

    setSelectedOptionIndex(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Wait a bit then move to next or finish
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOptionIndex(null);
        setShowFeedback(false);
      } else {
        onComplete(isCorrect ? score + 1 : score);
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
      {/* Progress */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <span className="text-lg font-bold text-blue-400">Question {currentIndex + 1} / {questions.length}</span>
        <span className="text-lg font-bold text-orange-400">Score: {score}</span>
      </div>

      {/* Sequence Display */}
      <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 w-full mb-8 border-4 border-blue-100">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
          {currentQuestion.sequence.map((item, idx) => (
            <div 
              key={idx} 
              className={`
                flex flex-col items-center justify-center 
                w-24 h-32 md:w-32 md:h-40 rounded-xl border-b-4 
                transition-transform duration-300
                ${item.isMissing 
                  ? 'bg-blue-50 border-blue-300 border-dashed animate-pulse' 
                  : 'bg-slate-50 border-slate-200'
                }
              `}
            >
              {item.isMissing ? (
                <>
                  <span className="text-5xl font-bold text-blue-400">?</span>
                  <span className="text-sm font-medium text-blue-300 mt-2">???</span>
                </>
              ) : (
                <>
                  <span className="text-4xl md:text-5xl font-bold text-slate-700">{item.digit}</span>
                  <span className="text-sm font-medium text-slate-400 mt-2 px-2 text-center leading-tight">
                    {item.word}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-slate-400 mt-8 text-sm uppercase tracking-wide">
            Find the missing number
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === currentQuestion.correctOptionIndex;
            
            let buttonStyle = "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700";
            
            if (showFeedback) {
                if (isCorrect) {
                    buttonStyle = "bg-green-100 border-green-500 text-green-700 shadow-none translate-y-1";
                } else if (isSelected && !isCorrect) {
                    buttonStyle = "bg-red-100 border-red-500 text-red-700 shadow-none translate-y-1 opacity-60";
                } else {
                    buttonStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                }
            }

            return (
                <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={showFeedback}
                className={`
                    relative p-6 rounded-2xl border-b-4 shadow-md text-center transition-all duration-200
                    flex flex-col items-center justify-center
                    active:border-b-0 active:translate-y-1 active:shadow-none
                    ${buttonStyle}
                `}
                >
                <span className="text-3xl font-bold mb-1">{option.digit}</span>
                <span className="text-sm font-medium">{option.word}</span>
                
                {showFeedback && isCorrect && (
                    <div className="absolute top-2 right-2 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                </button>
            );
        })}
      </div>
      
      {showFeedback && (
          <div className="mt-8 text-center animate-fade-in">
              <p className="text-slate-500 italic">
                Pattern: {currentQuestion.patternDescription}
              </p>
          </div>
      )}
    </div>
  );
};

export default Game;
