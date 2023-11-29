import ProgressCircle from '@/components/ui/ProgressCircle';
import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import {
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader } from 'lucide-react';
import { JoinInfoPreview } from '../components/JoinInfoPreview';

function CreateJoinInfo() {
  const settingsToCreateList = [
    trpcReact.getVRChatPhotoDir.useQuery(),
    trpcReact.getVRChatLogFilesDir.useQuery(),
  ] as const;
  const readyToCreateFiles = settingsToCreateList.map(
    (setting) => setting.data?.error || 'ready',
  );
  const progressToReady =
    100 *
    (readyToCreateFiles.filter((status) => status === 'ready').length /
      readyToCreateFiles.length);
  const errorList = settingsToCreateList
    .map((setting) => setting.data?.error)
    .filter((error) => error)
    .map((error) => {
      return match(error)
        .with(
          'logFileDirNotFound',
          () => 'ログファイルのディレクトリが見つかりませんでした',
        )
        .with(
          'photoYearMonthDirsNotFound',
          () => '写真のディレクトリにyyyy-mmのフォルダが見つかりませんでした',
        )
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with(
          'photoDirReadError',
          () => '写真のディレクトリが見つかりませんでした',
        )
        .with(null, () => `不明なエラーが発生しました: ${error}`)
        .with(undefined, () => `不明なエラーが発生しました: ${error}`)
        .exhaustive();
    });

  const createFilesMutation = trpcReact.createFiles.useMutation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(false);

  const handleClickCreateFiles = () => {
    setIsLoading(true);
    createFilesMutation
      .mutateAsync()
      .then((isSuccess) => {
        if (isSuccess) {
          navigate(ROUTER_PATHS.PHOTO_LIST);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  const disabledCreateFilesButton =
    createFilesMutation.isLoading || progressToReady !== 100;

  return !isLoading ? (
    <div className="flex flex-col justify-center items-center h-full space-y-4 py-4">
      <ProgressCircle value={progressToReady} size="large" />
      {/* progressToReady が 100 だったら */}
      <div className="text-xl text-gray-900 text-center space-y-2">
        {progressToReady === 100 ? (
          <>
            ファイル生成の準備が整いました
            <CheckIcon className="w-6 h-6 inline-block text-green-500" />
          </>
        ) : (
          <>
            ファイル生成の準備が整っていません
            <ExclamationTriangleIcon className="w-6 h-6 inline-block text-red-500" />
          </>
        )}
        <div className="text-center text-sm">
          <p>写真を撮影したワールドを記録できます</p>
          <p>
            (記録できるのは最後のVRChat起動から約24時間ほど前までに撮った写真です)
          </p>
        </div>
      </div>
      {/* エラーがあったら */}
      {errorList.length > 0 && (
        <div className="text-red-500">
          {errorList.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}

      {errorList.length === 0 ? (
        <>
          <div className="px-8 flex-grow overflow-hidden rounded-lg">
            <JoinInfoPreview />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={disabledCreateFilesButton}>保存する</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>実行しても良いですか？</AlertDialogTitle>
                <AlertDialogDescription>
                  VRChatの写真と同じ場所に訪れたワールドの記録を画像として保存します
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClickCreateFiles}
                  disabled={disabledCreateFilesButton}
                >
                  実行
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <Link to={ROUTER_PATHS.SETTING}>
          <Button>設定画面へ</Button>
        </Link>
      )}
    </div>
  ) : (
    <div className="flex flex-col justify-center items-center h-full">
      <Loader className="w-8 h-8" />
      <div className="text-xl text-gray-900 text-center space-y-2">
        ファイル生成中です
        <div className="text-center text-sm">
          <p>しばらくお待ちください</p>
        </div>
      </div>
    </div>
  );
}

export default CreateJoinInfo;
