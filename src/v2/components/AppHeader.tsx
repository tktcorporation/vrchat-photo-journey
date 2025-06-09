import { Button } from '@/components/ui/button';
import { Download, Minus, Square, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { trpcReact as trpc } from '../../trpc';

/**
 * ウィンドウ操作ボタンとアップデート通知を表示するアプリ上部のヘッダー。
 * アプリ全体で共通して使用される。
 */
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
      className="flex h-8 items-center justify-between px-4 select-none minimal-header"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" />

      <div
        className="flex gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {updateDownloaded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => quitAndInstall.mutate()}
            className="h-6 w-6 p-0 hover:bg-green-500/15 text-green-500/70 hover:text-green-500 transition-colors duration-150 rounded-sm"
            title="アップデートをインストール"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="h-6 w-6 p-0 hover:bg-muted/40 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150 rounded-sm"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          className="h-6 w-6 p-0 hover:bg-muted/40 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150 rounded-sm"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 hover:bg-red-500/80 text-muted-foreground/60 hover:text-white transition-colors duration-150 rounded-sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
