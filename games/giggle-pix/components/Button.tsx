import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative font-bold py-3 px-6 rounded-2xl border-2 border-black shadow-comic transition-all active:translate-y-1 active:shadow-comic-hover disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";
  
  const variants = {
    primary: "bg-kid-purple text-white hover:bg-purple-500",
    secondary: "bg-white text-black hover:bg-gray-50",
    danger: "bg-kid-pink text-white hover:bg-red-500",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};