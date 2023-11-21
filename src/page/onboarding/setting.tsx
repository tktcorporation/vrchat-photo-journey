import React from 'react';
import { Link } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { ROUTER_PATHS } from '@/constants';
import { Button } from '@/components/ui/button';
import { ChevronRight, AlertTriangle, Check } from 'lucide-react';
import ProgressCircle from '@/components/ui/ProgressCircle';

export function OnBordingSetting() {
  const logFilesDirError = trpcReact.getVRChatLogFilesDir.useQuery().data?.error;
  const vrchatPhotoDirError = trpcReact.getVRChatPhotoDir.useQuery().data?.error;

  const progressToReady = 100 * (logFilesDirError && vrchatPhotoDirError ? 0 : 1);

  const statusIcon = (err: string | undefined | null) => {
    if (err) {
      return <AlertTriangle size={24} className="text-red-500" />;
    }
    return <Check size={24} className="text-green-500" />;
  };

  return (
    <div className="space-y-4">
      <ProgressCircle value={progressToReady} size="large" />
      <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
        <div>{statusIcon(logFilesDirError)}</div>
        <div className="space-y-0.5">
          <div className="text-base">ログファイルの場所</div>
          <div className="text-sm text-muted-foreground">
            VRChat が生成するシステムログ
            {/* Joinした日時や、ワールドの情報を取得するために使います */}
          </div>
        </div>
        <div>
          <Link to={ROUTER_PATHS.SETTING_VRCHAT_LOG_PATH}>
            <Button variant="ghost">
              <ChevronRight size={24} />
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
        <div>{statusIcon(vrchatPhotoDirError)}</div>
        <div className="space-y-0.5">
          <div className="text-base">写真ファイルの場所</div>
          <div className="text-sm text-muted-foreground">カメラで取った写真が保存される</div>
        </div>
        <div>
          <Link to={ROUTER_PATHS.SETTING_VRCHAT_PHOTO_PATH}>
            <Button variant="ghost">
              <ChevronRight size={24} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
