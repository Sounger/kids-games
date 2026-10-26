
export type ActionType = 
  | 'SKIBIDI' 
  | 'JUMPING_JACKS' 
  | 'ROOSTER' 
  | 'LOSE_TURN' 
  | 'SPIN' 
  | 'DANCE' 
  | 'FORWARD' 
  | 'BACK' 
  | 'NONE' 
  | 'FINISH'
  | 'STAMP'
  | 'CLAP'
  | 'FROG'
  | 'WORM'
  | 'LAUGH'
  | 'BEAR'
  | 'PAT'
  | 'SNEEZE'
  | 'BALANCE'
  | 'SHOUT';

export interface Space {
  id: number;
  label: string;
  type: ActionType;
  value?: number; // for Move Forward X
  description?: string;
}

export interface Player {
  id: number;
  name: string;
  animal: string;
  color: string;
  position: number;
  isSkippingTurn: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  winner: Player | null;
  lastDiceRoll: number | null;
  currentAction: Space | null;
}
