import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
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
import { JoinInfoPreview } from '../../components/JoinInfoPreview';

export const CreateJoinInfo = () => {
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

  const createFilesMutation =
    trpcReact.joinInfoLogFile.createFiles.useMutation();
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
    <div className="flex flex-col justify-center items-center h-full">
      {/* エラーがあったら */}
      {errorList.length > 0 && (
        <div className="flex justify-center items-center h-full">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-xl font-bold">設定を完了させてください</h1>
              {errorList.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
            <div>
              <Link to={ROUTER_PATHS.SETTING} className="text-blue-500">
                設定画面へ
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorList.length === 0 ? (
        <>
          <div className="flex-grow overflow-hidden rounded-lg">
            <JoinInfoPreview />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              {/* TODO: ウィンドウが狭いとボタンの株が埋もれてしまうので mb で応急処理 */}
              <Button
                disabled={disabledCreateFilesButton}
                className="mt-4 mb-8"
              >
                保存する
              </Button>
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
        <></>
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
};
