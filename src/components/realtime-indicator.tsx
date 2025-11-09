import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
}

export function RealtimeIndicator({ isConnected }: RealtimeIndicatorProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs md:text-sm">
        <WifiOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-green-50 text-green-700 text-xs md:text-sm">
      <div className="relative">
        <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
      </div>
      <span className="hidden sm:inline">Online</span>
    </div>
  );
}
