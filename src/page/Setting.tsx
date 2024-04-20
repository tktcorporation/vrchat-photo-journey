import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { AlertTriangle, Bed, Check, ChevronRight, Info } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

function Setting() {
  // 初期表示時に log-files-dir を取得する
  const logFilesDirError =
    trpcReact.getVRChatLogFilesDir.useQuery().data?.error;

  const statusIcon = (err: string | undefined | null) => {
    if (err) {
      return <AlertTriangle size={24} className="text-red-500" />;
    }
    return <Check size={24} className="text-green-500" />;
  };

  const openAppLogFileMutation =
    trpcReact.openElectronLogOnExplorer.useMutation();

  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full space-y-9">
        <h3 className="text-lg font-medium">設定</h3>
        <div className="divide-y *:py-7 first:*:pt-0 last:*:pb-0">
          <div className="flex flex-row items-center justify-between p-5 space-x-4">
            <div className="flex flex-row items-center space-x-4">
              <Info size={24} />
              <div className="space-y-0.5">
                <div className="text-base">アプリケーション情報</div>
              </div>
            </div>
            <div>
              <Link to={ROUTER_PATHS.SETTING_ABOUT_APP}>
                <Button variant="link">
                  <ChevronRight size={24} />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between p-5 space-x-4">
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
                <Button variant="link">
                  <ChevronRight size={24} />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between p-5 space-x-4">
            <div>
              <Bed size={24} />
            </div>
            <div className="space-y-0.5">
              <div className="text-base">バックグラウンド設定</div>
            </div>
            <div>
              <Link to={ROUTER_PATHS.SETTING_BACKGROUND_EXECUTION}>
                <Button variant="link">
                  <ChevronRight size={24} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => openAppLogFileMutation.mutate()}
          >
            アプリログを開く
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Setting;
