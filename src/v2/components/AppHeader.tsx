import { Button } from '@/components/ui/button';
import { Download, Minus, Square, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { trpcReact as trpc } from '../../trpc';

export const AppHeader: React.FC = () => {
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  const { data: updateStatus } = trpc.updater.getUpdateStatus.useQuery(
    undefined,
    {
      refetchInterval: 1000 * 60 * 60 * 24 * 2, // 2日ごとに更新をチェック
    },
  );

  const checkForUpdates = trpc.updater.checkForUpdates.useMutation();
  const quitAndInstall = trpc.updater.quitAndInstall.useMutation();

  useEffect(() => {
    if (updateStatus) {
      setUpdateDownloaded(updateStatus.updateDownloaded);
    }
  }, [updateStatus]);

  useEffect(() => {
    // 起動時に更新をチェック
    checkForUpdates.mutate();
  }, []);

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
      className="flex h-8 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 select-none bg-[hsl(var(--gradient-start))] dark:bg-[hsl(var(--gradient-start))]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" />

      <div
        className="flex gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {updateDownloaded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => quitAndInstall.mutate()}
            className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-700 text-green-500"
            title="アップデートをインストール"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
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
