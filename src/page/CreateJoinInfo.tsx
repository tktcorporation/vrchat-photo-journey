import React from 'react';
import { match } from 'ts-pattern';
import { Link, useNavigate } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { ROUTER_PATHS } from '@/constants';
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';
import ProgressCircle from '@/components/ui/ProgressCircle';
import { Button } from '@/component/ui/button';

function CreateJoinInfo() {
  const settingsToCreateList = [
    trpcReact.getVRChatPhotoDir.useQuery(),
    trpcReact.getVRChatLogFilesDir.useQuery()
  ] as const;
  const readyToCreateFiles = settingsToCreateList.map((setting) => setting.data?.error || 'ready');
  const progressToReady =
    100 * (readyToCreateFiles.filter((status) => status === 'ready').length / readyToCreateFiles.length);
  const errorList = settingsToCreateList
    .map((setting) => setting.data?.error)
    .filter((error) => error)
    .map((error) => {
      return match(error)
        .with('logFileDirNotFound', () => 'ログファイルのディレクトリが見つかりませんでした')
        .with('photoYearMonthDirsNotFound', () => '写真のディレクトリにyyyy-mmのフォルダが見つかりませんでした')
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('photoDirReadError', () => '写真のディレクトリが見つかりませんでした')
        .with(null, () => `不明なエラーが発生しました: ${error}`)
        .with(undefined, () => `不明なエラーが発生しました: ${error}`)
        .exhaustive();
    });

  const createFilesMutation = trpcReact.createFiles.useMutation();
  const navigate = useNavigate();
  const handleClickCreateFiles = () => {
    createFilesMutation.mutateAsync().then((isSuccess) => {
      if (isSuccess) {
        navigate(ROUTER_PATHS.CREATED_RESULT);
      }
    });
  };
  const disabledCreateFilesButton = createFilesMutation.isLoading || progressToReady !== 100;

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-8">
        <ProgressCircle value={progressToReady} />
        {/* progressToReady が 100 だったら */}
        {progressToReady === 100 ? (
          <div className="text-2xl text-gray-900">
            ファイル生成の準備が整いました
            <CheckIcon className="w-6 h-6 inline-block text-green-500" />
          </div>
        ) : (
          <div className="text-2xl text-gray-900">
            ファイル生成の準備が整っていません
            <ExclamationTriangleIcon className="w-6 h-6 inline-block text-red-500" />
          </div>
        )}
        {/* エラーがあったら */}
        {errorList.length > 0 && (
          <div className="text-red-500">
            {errorList.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        )}

        <div className="flex space-x-4">
          {/* 設定に戻る */}
          <Link to={ROUTER_PATHS.SETTING}>
            <Button variant="outline">設定に戻る</Button>
          </Link>
          {/* ファイル生成ボタン */}
          <Button onClick={handleClickCreateFiles} disabled={disabledCreateFilesButton}>
            どこで撮ったか調べる
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateJoinInfo;
