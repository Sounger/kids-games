import React from 'react';

interface SequencerStepProps {
  active: boolean;
  isCurrent: boolean;
  color: string;
  onClick: () => void;
}

export const SequencerStep: React.FC<SequencerStepProps> = ({ 
  active, 
  isCurrent, 
  color, 
  onClick 
}) => {
  // Map tailwind color string (e.g., 'blue-500') to CSS variables or just class construction
  // We'll construct the dynamic class names carefully
  
  const baseClasses = "w-8 h-8 sm:w-10 sm:h-10 border-2 cursor-pointer transition-all duration-75 relative";
  
  // Parse the color to get the specific shade for active state
  // Simple mapping approach: color is "color-shade" like "blue-500"
  
  let bgClass = "bg-[#2d1b2e] border-gray-700"; // Inactive dark
  
  if (active) {
    bgClass = `bg-${color} border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]`;
  }
  
  if (isCurrent) {
    // If it's the current step, we highlight it
    // If it's also active, we make it brighter or flash
    const overlayClass = active ? "brightness-150 scale-110 z-10" : "bg-white/20";
    bgClass = `${bgClass} ${overlayClass}`;
  }

  return (
    <div 
      className={`${baseClasses} ${bgClass}`} 
      onClick={onClick}
      role="button"
      aria-label="Toggle step"
    >
      {/* Inner pixel detail for aesthetics */}
      {active && (
        <div className="absolute inset-1 bg-white/20 opacity-50 pointer-events-none" />
      )}
    </div>
  );
};