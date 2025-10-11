import React from 'react';

interface ClockIconProps {
  time: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ClockIcon: React.FC<ClockIconProps> = ({ time, size = 'sm', className = '' }) => {
  const date = new Date(`2000-01-01 ${time}`);
  const hours = date.getHours() % 12;
  const minutes = date.getMinutes();
  
  // Calculate angles for clock hands
  const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {/* Clock face */}
        <circle cx="12" cy="12" r="10" />
        
        {/* Hour markers */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hour => {
          const angle = hour * 30 - 90; // -90 to start from 12 o'clock
          const x1 = 12 + 8 * Math.cos((angle * Math.PI) / 180);
          const y1 = 12 + 8 * Math.sin((angle * Math.PI) / 180);
          const x2 = 12 + 9.5 * Math.cos((angle * Math.PI) / 180);
          const y2 = 12 + 9.5 * Math.sin((angle * Math.PI) / 180);
          
          return (
            <line
              key={hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="1"
            />
          );
        })}
        
        {/* Hour hand */}
        <line
          x1="12"
          y1="12"
          x2={12 + 5 * Math.cos((hourAngle - 90) * Math.PI / 180)}
          y2={12 + 5 * Math.sin((hourAngle - 90) * Math.PI / 180)}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Minute hand */}
        <line
          x1="12"
          y1="12"
          x2={12 + 7 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
          y2={12 + 7 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    </div>
  );
};

export default ClockIcon;
