import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-3"
      >
        {/* Crown base */}
        <path
          d="M50 20 L30 40 L35 70 L65 70 L70 40 L50 20 Z"
          fill="url(#goldGradient)"
          stroke="#8B5A00"
          strokeWidth="2"
        />
        {/* Crown jewels */}
        <circle cx="50" cy="35" r="4" fill="#DC2626" />
        <circle cx="35" cy="50" r="3" fill="#3B82F6" />
        <circle cx="65" cy="50" r="3" fill="#10B981" />
        {/* Crown peaks */}
        <path d="M50 20 L45 30 L50 25 L55 30 Z" fill="#FCD34D" />
        <path d="M30 40 L25 50 L30 45 L35 50 Z" fill="#FCD34D" />
        <path d="M70 40 L65 50 L70 45 L75 50 Z" fill="#FCD34D" />
        
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#D97706', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
            JN PALACE
          </span>
          <span className="text-xs text-amber-400 tracking-widest font-light">LUXURY HOTEL</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
