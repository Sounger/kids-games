import React from 'react';

interface FXKnobProps {
  label: string;
  value: number; // 0-100
  onChange: (val: number) => void;
  color: string;
  min?: number;
  max?: number;
}

export const FXKnob: React.FC<FXKnobProps> = ({ 
  label, 
  value, 
  onChange, 
  color,
  min = 0,
  max = 100 
}) => {
  // Calculate rotation: 0 -> -135deg, 100 -> +135deg
  const rotation = -135 + (value / 100) * 270;

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    // Simple vertical drag to change value could be implemented here
    // but for simplicity in this version, we will rely on clicks 
    // or external control. Let's make it clickable for quick jumps.
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none group">
      <div className="relative w-20 h-20">
        {/* Base Ring */}
        <div className="absolute inset-0 rounded-full border-[6px] border-gray-800 bg-gray-900 shadow-inner"></div>
        
        {/* Colored Active Arc (Simulated by border colors is hard for arc, using simple knob instead) */}
        
        {/* The Knob Itself */}
        <div 
          className="absolute inset-2 rounded-full border-b-4 border-r-4 border-black bg-gray-700 shadow-xl transition-transform duration-75 cursor-pointer hover:bg-gray-600"
          style={{ transform: `rotate(${rotation}deg)` }}
          title={label}
        >
          {/* Indicator Line */}
          <div className={`absolute top-1 left-1/2 w-1.5 h-6 -translate-x-1/2 rounded-full ${color}`}></div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</div>
        <div className={`text-xs ${color.replace('bg-', 'text-')} font-mono`}>{Math.round(value)}%</div>
      </div>
    </div>
  );
};