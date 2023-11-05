import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { match } from 'ts-pattern';
import { sourceBadge } from './components';

function Setting() {
  const { data: photoFilesDir, refetch } = trpcReact.getVRChatPhotoDir.useQuery();
  const errorMessage = match(photoFilesDir?.error)
    .with('photoYearMonthDirsNotFound', () => '2099-01 のようなフォルダがある場所を指定してください')
    .with('photoDirReadError', () => 'フォルダの読み取りに失敗しました')
    .with(undefined, () => undefined)
    .with(null, () => undefined)
    .exhaustive();

  const deleteStoredPathMutation = trpcReact.clearStoredSetting.useMutation();
  const setByDialogMutation = trpcReact.setVRChatPhotoDirByDialog.useMutation();

  const navigate = useNavigate();

  return (
    <div className="flex-auto">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="space-y-4 flex flex-col justify-center items-center">
          <h3 className="text-lg font-medium">写真ファイルの場所</h3>
          <div className="text-sm text-muted-foreground">写真と同じ場所にワールド情報がわかるファイルを生成します</div>
        </div>
        <div className="space-y-4 my-8 flex flex-col justify-center items-center">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
            <div className="text-base">{sourceBadge(photoFilesDir)}</div>
            <div className="text-base">
              <span>{photoFilesDir?.path}</span>
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
            deleteStoredPathMutation.mutateAsync('vrchatPhotoDir').then(() => {
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
