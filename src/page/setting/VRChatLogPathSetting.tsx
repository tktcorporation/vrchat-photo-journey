import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { match } from 'ts-pattern';
import { sourceBadge } from './components';

function Setting() {
  const { data: logFilesDir, refetch } = trpcReact.getVRChatLogFilesDir.useQuery();
  const errorMessage = match(logFilesDir?.error)
    .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
    .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
    .with(undefined, () => undefined)
    .with(null, () => undefined)
    .exhaustive();

  const deleteStoredPathMutation = trpcReact.clearStoredSetting.useMutation();
  const setByDialogMutation = trpcReact.setVRChatLogFilesDirByDialog.useMutation();

  const navigate = useNavigate();

  return (
    <div className="flex-auto">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="space-y-4 flex flex-col justify-center items-center">
          <h3 className="text-lg font-medium">ログファイルの場所</h3>
          <div className="text-sm text-muted-foreground">Joinした日時や、ワールドの情報を取得するために使います</div>
        </div>
        <div className="space-y-4 my-8 flex flex-col justify-center items-center">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
            <div className="text-base">{sourceBadge(logFilesDir)}</div>
            <div className="text-base">
              <span>{logFilesDir?.path}</span>
            </div>

            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  setByDialogMutation.mutateAsync().then(() => {
                    refetch();
                  });
                }}
              >
                <FolderOpen size={24} />
              </Button>
            </div>
          </div>
          <div className="text-base text-red-500">{errorMessage}</div>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            deleteStoredPathMutation.mutateAsync('logFilesDir').then(() => {
              refetch();
            });
          }}
        >
          設定をリセットする
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          戻る
        </Button>
      </div>
    </div>
  );
}

export default Setting;
