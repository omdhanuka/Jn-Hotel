import React, { useState, useRef, useEffect } from 'react';

interface ClockTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
  className?: string;
}

const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange, label, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours === 0 ? 12 : hours > 12 ? hours - 12 : hours);
      setSelectedMinute(minutes);
      setIsPM(hours >= 12);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clockRef.current && !clockRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (hour: number, minute: number, pm: boolean) => {
    const hour24 = pm ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (newHour?: number, newMinute?: number, newPM?: boolean) => {
    const hour = newHour !== undefined ? newHour : selectedHour;
    const minute = newMinute !== undefined ? newMinute : selectedMinute;
    const pm = newPM !== undefined ? newPM : isPM;
    
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsPM(pm);
    
    const timeString = formatTime(hour, minute, pm);
    onChange(timeString);
  };

  const handleClockClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    
    const angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    
    // Determine if clicking for hours or minutes based on distance from center
    const distance = Math.sqrt(x * x + y * y);
    const clockRadius = 80; // Approximate radius
    
    if (distance < clockRadius * 0.7) {
      // Inner circle - hours
      const hour = Math.round(normalizedAngle / 30) || 12;
      handleTimeChange(hour);
    } else {
      // Outer circle - minutes
      const minute = Math.round(normalizedAngle / 6) % 60;
      handleTimeChange(undefined, minute);
    }
  };

  const displayTime = value ? 
    new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }) : 'Select time';

  return (
    <div className={`relative ${className}`} ref={clockRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <div className="flex items-center justify-between">
          <span>{displayTime}</span>
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          <div className="flex justify-center mb-4">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="cursor-pointer"
              onClick={handleClockClick}
            >
              {/* Clock face */}
              <circle cx="100" cy="100" r="95" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
              
              {/* Hour markers and numbers */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hour => {
                const angle = (hour * 30 - 90) * Math.PI / 180;
                const x = 100 + 75 * Math.cos(angle);
                const y = 100 + 75 * Math.sin(angle);
                const markerX = 100 + 85 * Math.cos(angle);
                const markerY = 100 + 85 * Math.sin(angle);
                
                return (
                  <g key={hour}>
                    <line
                      x1={markerX}
                      y1={markerY}
                      x2={100 + 90 * Math.cos(angle)}
                      y2={100 + 90 * Math.sin(angle)}
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-sm font-medium cursor-pointer ${
                        selectedHour === hour ? 'fill-blue-600' : 'fill-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimeChange(hour);
                      }}
                    >
                      {hour}
                    </text>
                  </g>
                );
              })}
              
              {/* Minute markers */}
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => {
                const angle = (minute * 6 - 90) * Math.PI / 180;
                const x = 100 + 60 * Math.cos(angle);
                const y = 100 + 60 * Math.sin(angle);
                
                return (
                  <text
                    key={minute}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-xs cursor-pointer ${
                      selectedMinute === minute ? 'fill-blue-600 font-bold' : 'fill-gray-500'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeChange(undefined, minute);
                    }}
                  >
                    {minute.toString().padStart(2, '0')}
                  </text>
                );
              })}
              
              {/* Hour hand */}
              <line
                x1="100"
                y1="100"
                x2={100 + 45 * Math.cos((selectedHour * 30 + selectedMinute * 0.5 - 90) * Math.PI / 180)}
                y2={100 + 45 * Math.sin((selectedHour * 30 + selectedMinute * 0.5 - 90) * Math.PI / 180)}
                stroke="#1f2937"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Minute hand */}
              <line
                x1="100"
                y1="100"
                x2={100 + 70 * Math.cos((selectedMinute * 6 - 90) * Math.PI / 180)}
                y2={100 + 70 * Math.sin((selectedMinute * 6 - 90) * Math.PI / 180)}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Center dot */}
              <circle cx="100" cy="100" r="4" fill="#1f2937"/>
            </svg>
          </div>
          
          {/* AM/PM Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => handleTimeChange(undefined, undefined, false)}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                  !isPM ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange(undefined, undefined, true)}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                  isPM ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                PM
              </button>
            </div>
          </div>
          
          {/* Quick time buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['09:00', '12:00', '15:00', '18:00', '21:00'].map(quickTime => (
              <button
                key={quickTime}
                type="button"
                onClick={() => {
                  const [hours, minutes] = quickTime.split(':').map(Number);
                  const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                  const pm = hours >= 12;
                  handleTimeChange(hour12, minutes, pm);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {new Date(`2000-01-01T${quickTime}`).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </button>
            ))}
          </div>
          
          {/* Done button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default ClockTimePicker;
