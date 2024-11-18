import { trpcReact } from '@/trpc';
import { Button } from '@/v1/components/ui/button';
import { FolderOpen } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';
import { sourceBadge } from './components';

export const VRChatPhotoDirPathSetting = () => {
  const { data: vrcPhotoDirPath, refetch } =
    trpcReact.vrchatPhoto.getVRChatPhotoDirPath.useQuery();

  const deleteStoredPathMutation =
    trpcReact.vrchatPhoto.clearVRChatPhotoDirPathInSettingStore.useMutation();
  const setByDialogMutation =
    trpcReact.vrchatPhoto.setVRChatPhotoDirPathToSettingStore.useMutation();

  return (
    <div className="flex-auto h-full">
      <div className="flex-col h-full inline-flex space-y-4">
        <div className="space-y-4 flex flex-col">
          <h3 className="text-lg font-medium">
            VRChatで撮影した写真の保存場所
          </h3>
          <div className="text-sm text-muted-foreground">
            VRChatで撮影した写真が保存されている場所を設定します
          </div>
        </div>
        <div className="space-y-4 my-8 flex flex-col">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
            <div className="text-base">
              <span>{vrcPhotoDirPath?.value}</span>
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
          {/* <div className="text-base text-red-500">{errorMessage}</div> */}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            deleteStoredPathMutation.mutateAsync().then(() => {
              refetch();
            });
          }}
        >
          設定をリセットする
        </Button>
      </div>
    </div>
  );
};
