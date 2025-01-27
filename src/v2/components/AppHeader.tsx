import { Button } from '@/components/ui/button';
import { Minus, Square, X } from 'lucide-react';
import type React from 'react';

export const AppHeader: React.FC = () => {
  const handleMinimize = () => {
    window.Main?.Minimize();
  };

  const handleMaximize = () => {
    window.Main?.Maximize();
  };

  const handleClose = () => {
    window.Main?.Close();
  };

  return (
    <div
      className="flex h-8 items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" />

      <div
        className="flex gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
