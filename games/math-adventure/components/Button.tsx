import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold rounded-2xl transition-all duration-200 transform active:scale-95 shadow-md border-b-4 focus:outline-none";
  
  const variants = {
    primary: "bg-blue-500 text-white border-blue-700 hover:bg-blue-400",
    secondary: "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200",
    success: "bg-green-500 text-white border-green-700 hover:bg-green-400",
    danger: "bg-red-500 text-white border-red-700 hover:bg-red-400",
  };

  const sizes = {
    md: "py-3 px-6 text-lg",
    lg: "py-4 px-8 text-2xl w-full",
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
