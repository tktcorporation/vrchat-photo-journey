import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/component/ui/button';
import { ROUTER_PATHS } from '../constants';
import { trpcReact } from '../trpc';

function CreatedResult() {
  const vrchatPhotoDir = trpcReact.getVRChatPhotoDir.useQuery().data?.path;
  const mutate = trpcReact.openPathOnExplorer.useMutation();
  const handleOpenFolder = () => {
    mutate.mutate(vrchatPhotoDir!);
  };

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4">
        <p>VRChatの写真フォルダにファイルを生成しました</p>
        <Button onClick={handleOpenFolder}>写真フォルダを開いて確認する</Button>

        {/* 設定に戻る */}
        <Link to={ROUTER_PATHS.HOME}>
          <Button>戻る</Button>
        </Link>
      </div>
    </div>
  );
}

export default CreatedResult;
