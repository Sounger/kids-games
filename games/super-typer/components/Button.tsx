import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1";
  
  const variants = {
    primary: "bg-white text-indigo-600 hover:bg-indigo-50",
    secondary: "bg-purple-200 text-purple-800 hover:bg-purple-100",
    success: "bg-green-400 text-white hover:bg-green-300",
  };

  const sizes = {
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-2xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};