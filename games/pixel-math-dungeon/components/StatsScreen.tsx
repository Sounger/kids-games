
import React, { useEffect, useState } from 'react';
import { GameState, SessionStats, PlayerStats } from '../types';
import { loadStats, saveSession } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Clock, Skull, CheckCircle, RotateCcw, Smile } from 'lucide-react';

interface Props {
  gameState: GameState;
  session: SessionStats | null;
  playerName: string;
  onBack: () => void;
}

const StatsScreen: React.FC<Props> = ({ gameState, session, playerName, onBack }) => {
  const [globalStats, setGlobalStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    // If coming from a game end, the stats were already saved in GameLoop via saveSession
    // We just need to load them to display Global Stats
    const loaded = loadStats();
    setGlobalStats(loaded);
  }, [gameState, session]);

  const isSessionView = gameState === 'GAME_OVER' || gameState === 'VICTORY';
  const headerColor = gameState === 'VICTORY' ? 'text-green-400' : gameState === 'GAME_OVER' ? 'text-red-500' : 'text-yellow-400';
  const title = gameState === 'VICTORY' ? 'LEVEL COMPLETE!' : gameState === 'GAME_OVER' ? 'GAME OVER' : 'HERO STATISTICS';

  // Prepare chart data if global stats exist
  const chartData = globalStats ? Object.keys(globalStats.rangeStats).map(key => ({
    name: key.replace('ADDITION_', '+ ').replace('SUBTRACTION_', '- ').replace('MIXED_', 'Mix '),
    correct: globalStats.rangeStats[key].correct,
    attempts: globalStats.rangeStats[key].attempts,
    accuracy: Math.round((globalStats.rangeStats[key].correct / globalStats.rangeStats[key].attempts) * 100) || 0
  })) : [];

  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-gray-900 flex flex-col items-center">
      
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className={`text-6xl font-bold ${headerColor} mb-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>{title}</h1>
          <p className="text-2xl text-gray-400">{playerName}</p>
        </div>

        {/* Session Stats (Only if game just ended) */}
        {isSessionView && session && (
          <div className="bg-gray-800 border-4 border-gray-600 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl text-white mb-4 border-b-2 border-gray-600 pb-2">Session Report</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div className="p-4 bg-black/30 rounded">
                <Smile className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">{session.bonusEmojis}</div>
                <div className="text-xs text-gray-400 uppercase">Coins</div>
              </div>
              <div className="p-4 bg-black/30 rounded">
                <Clock className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">{Math.floor(session.durationSeconds)}s</div>
                <div className="text-xs text-gray-400 uppercase">Time</div>
              </div>
              <div className="p-4 bg-black/30 rounded">
                <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">{session.doorsOpened} / {session.doorsOpened + session.mistakes}</div>
                <div className="text-xs text-gray-400 uppercase">Solved</div>
              </div>
               <div className="p-4 bg-black/30 rounded">
                <Trophy className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">{Math.round(session.accuracy)}%</div>
                <div className="text-xs text-gray-400 uppercase">Accuracy</div>
              </div>
               <div className="p-4 bg-black/30 rounded">
                <Skull className="w-8 h-8 mx-auto text-red-400 mb-2" />
                <div className="text-2xl font-bold text-white">{session.mistakes}</div>
                <div className="text-xs text-gray-400 uppercase">Mistakes</div>
              </div>
            </div>
            <div className="mt-4 text-center text-gray-400">
               Mode: <span className="text-white">{session.operation} {session.difficulty}</span>
            </div>
          </div>
        )}

        {/* Global Stats */}
        {globalStats && (
           <div className="bg-gray-800 border-4 border-gray-600 p-6 rounded-lg shadow-xl">
              <h2 className="text-2xl text-white mb-4 border-b-2 border-gray-600 pb-2">Career Performance</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                   <div className="text-3xl font-bold text-yellow-500">{globalStats.totalSessions}</div>
                   <div className="text-sm text-gray-400">Total Games</div>
                </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-green-500">
                     {globalStats.totalAttempts > 0 
                        ? Math.round((globalStats.totalCorrect / globalStats.totalAttempts) * 100) 
                        : 0}%
                   </div>
                   <div className="text-sm text-gray-400">Avg Accuracy</div>
                </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-red-500">{globalStats.monstersDefeated}</div>
                   <div className="text-sm text-gray-400">Monsters Slain</div>
                </div>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-purple-500">{globalStats.deaths}</div>
                   <div className="text-sm text-gray-400">Total Deaths</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full bg-black/20 p-4 rounded">
                <h3 className="text-center text-gray-400 mb-2 text-sm">Accuracy by Level</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="accuracy" fill="#d3a068" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.accuracy > 80 ? '#4ade80' : entry.accuracy > 50 ? '#facc15' : '#f87171'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        )}

        <button 
          onClick={onBack}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-4 rounded border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw /> {isSessionView ? 'PLAY AGAIN' : 'BACK TO MENU'}
        </button>

      </div>
    </div>
  );
};

export default StatsScreen;
