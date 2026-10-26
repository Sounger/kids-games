
import React from 'react';
import { Space, Player } from '../types';
import { 
  AlertCircle, 
  ArrowRightCircle, 
  ArrowLeftCircle, 
  Footprints, 
  Music, 
  RotateCw, 
  Ghost, 
  Timer,
  Hand,
  Smile,
  PawPrint,
  Wind,
  Megaphone,
  UserRound,
  Brain
} from 'lucide-react';

interface ActionModalProps {
  space: Space;
  player: Player;
  onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ space, player, onClose }) => {
  const getIcon = () => {
    switch (space.type) {
      case 'SKIBIDI': return <Ghost className="w-16 h-16 text-purple-500" />;
      case 'JUMPING_JACKS': return <Footprints className="w-16 h-16 text-blue-500" />;
      case 'STAMP': return <Footprints className="w-16 h-16 text-amber-700" />;
      case 'CLAP': return <Hand className="w-16 h-16 text-yellow-500" />;
      case 'FROG': return <UserRound className="w-16 h-16 text-green-600" />;
      case 'WORM': return <RotateCw className="w-16 h-16 text-pink-400" />;
      case 'LAUGH': return <Smile className="w-16 h-16 text-orange-400" />;
      case 'BEAR': return <PawPrint className="w-16 h-16 text-amber-900" />;
      case 'PAT': return <Brain className="w-16 h-16 text-sky-400" />;
      case 'SNEEZE': return <Wind className="w-16 h-16 text-blue-300" />;
      case 'BALANCE': return <UserRound className="w-16 h-16 text-emerald-500" />;
      case 'SHOUT': return <Megaphone className="w-16 h-16 text-red-500" />;
      case 'ROOSTER': return <AlertCircle className="w-16 h-16 text-orange-500" />;
      case 'SPIN': return <RotateCw className="w-16 h-16 text-pink-500" />;
      case 'DANCE': return <Music className="w-16 h-16 text-indigo-500" />;
      case 'FORWARD': return <ArrowRightCircle className="w-16 h-16 text-green-500" />;
      case 'BACK': return <ArrowLeftCircle className="w-16 h-16 text-red-500" />;
      case 'LOSE_TURN': return <Timer className="w-16 h-16 text-gray-500" />;
      default: return null;
    }
  };

  const getThemeColor = () => {
    switch (space.type) {
      case 'FORWARD': return 'border-green-400 text-green-600';
      case 'BACK': return 'border-red-400 text-red-600';
      case 'LOSE_TURN': return 'border-gray-400 text-gray-600';
      case 'SHOUT': return 'border-red-500 text-red-600';
      case 'CLAP': return 'border-yellow-400 text-yellow-600';
      case 'FROG': return 'border-green-600 text-green-700';
      default: return 'border-purple-400 text-purple-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl border-[10px] ${getThemeColor()}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl mb-2">{player.animal}</div>
          <h3 className="text-2xl font-game uppercase tracking-tight">MAGIC CHALLENGE!</h3>
          
          <div className="my-6 transform scale-110 animate-bounce">
            {getIcon()}
          </div>

          <p className="text-2xl font-bold text-gray-800 mb-6 leading-tight">
            {space.description}
          </p>

          <button 
            onClick={onClose}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-game text-xl py-4 rounded-3xl shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            I DID IT!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
