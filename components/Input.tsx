import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-gray-500 text-xs font-bold mb-1 ml-1 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-accent-primary">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-onix-800 text-white border-2 rounded-lg py-3 px-4 leading-tight focus:outline-none focus:bg-onix-900 transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
              : 'border-onix-700 focus:border-accent-primary focus:shadow-accent'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] italic mt-1 ml-1">{error}</p>}
    </div>
  );
};