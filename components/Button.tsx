import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 font-display uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variants = {
    primary: "bg-neon-yellow text-royal-900 hover:shadow-neon-strong hover:bg-[#d9ff40]",
    secondary: "bg-royal-700 text-white hover:bg-royal-600 border border-royal-600",
    outline: "bg-transparent border-2 border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-royal-900 hover:shadow-neon",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};