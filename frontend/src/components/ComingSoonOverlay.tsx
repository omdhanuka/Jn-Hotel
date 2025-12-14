import React from 'react';
import { Clock, Lock } from 'lucide-react';

interface ComingSoonOverlayProps {
  title?: string;
  message?: string;
  icon?: 'clock' | 'lock';
  blur?: boolean;
}

const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  title = 'Coming Soon',
  message = 'This feature is currently under development and will be available soon.',
  icon = 'clock',
  blur = true
}) => {
  const IconComponent = icon === 'clock' ? Clock : Lock;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-white/95 ${blur ? 'backdrop-blur-sm' : ''}`}></div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 py-12 max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full">
              <IconComponent className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          {message}
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-indigo-600">
          <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>We're working hard to bring you this feature.</p>
          <p className="mt-1">Thank you for your patience!</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
