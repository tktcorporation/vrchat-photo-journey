import React from 'react';
import { match } from 'ts-pattern';
import { Link, useNavigate } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { ROUTER_PATHS } from '@/constants';
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';
import ProgressCircle from '@/components/ui/ProgressCircle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

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
        navigate(ROUTER_PATHS.PHOTO_LIST);
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={disabledCreateFilesButton}>どこで撮ったか調べる</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>実行しても良いですか？</AlertDialogTitle>
                <AlertDialogDescription>
                  ログファイルを参照して、VRChatの写真と同じ場所に訪れたワールドの記録を作成します
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleClickCreateFiles} disabled={disabledCreateFilesButton}>
                  実行
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function Onboarding() {
  const [tabValue, setTabValue] = React.useState('0');
  const handleChangeTab = (value: string) => {
    setTabValue(value);
  };
  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-8">
        <Tabs value={tabValue} onValueChange={handleChangeTab}>
          <TabsList>
            <TabsTrigger value="0">・</TabsTrigger>
            <TabsTrigger value="1">・</TabsTrigger>
            <TabsTrigger value="2">・</TabsTrigger>
            <TabsTrigger value="3">・</TabsTrigger>
            <TabsTrigger value="4">・</TabsTrigger>
          </TabsList>
          <TabsContent value="0">
            <p>ようこそ</p>
            <p>イメージ画像</p>
            <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
          </TabsContent>
          <TabsContent value="1">
            <p>写真が保存されているフォルダに画像ファイルを生成することで、訪れたワールドがひと目で分かり、</p>
            <p>写真が撮影された場所がわかるようになります</p>
            <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
          </TabsContent>
          <TabsContent value="2">
            <p>アプリケーションを使う準備が整っているかを確認します</p>
          </TabsContent>
          <TabsContent value="3">
            <CreateJoinInfo />
            <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
          </TabsContent>
          <TabsContent value="4">
            <p>バックグラウンドで写真の撮影場所を常に記録する</p>
            <Link to={ROUTER_PATHS.PHOTO_LIST}>
              <Button>次へ</Button>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Onboarding;
