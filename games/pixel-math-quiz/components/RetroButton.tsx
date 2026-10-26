import React from 'react';
import { SoundEffects } from '../utils/soundEffects';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'neutral';
  className?: string;
  silent?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  silent = false,
  onClick,
  onMouseEnter,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 font-bold border-2 border-black shadow-retro active:shadow-retro-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-100 text-sm md:text-base uppercase tracking-wider";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-50",
    secondary: "bg-retro-blue text-white hover:brightness-110",
    danger: "bg-red-500 text-white hover:brightness-110",
    success: "bg-retro-green text-black hover:brightness-110",
    neutral: "bg-gray-200 text-black hover:bg-gray-300",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!silent) SoundEffects.click();
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!silent) SoundEffects.hover();
    onMouseEnter?.(e);
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </button>
  );
};
