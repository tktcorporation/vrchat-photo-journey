import { trpcReact } from '@/trpc';
import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '@/components/SideBar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { Link } from 'react-router-dom';
import { match } from 'ts-pattern';
import { CreateJoinInfo } from './CreateJoinInfo';
import { JoinInfoList } from './PhotoItemList';
import { usePhotoItems, useYearMonthList } from './composable';

interface JoinListProps {
  selectedFolderYearMonth: { year: string; month: string };
}
const JoinListComponent = ({ selectedFolderYearMonth }: JoinListProps) => {
  const { photoItemList, photoItemFetchError, refetchPhotoItemList } =
    usePhotoItems(selectedFolderYearMonth);

  useEffect(() => {
    // データを更新するためにrefetch関数を呼び出す
    refetchPhotoItemList?.();
  }, [selectedFolderYearMonth.month, selectedFolderYearMonth.year]);

  const openDirOnExplorerMutatation = trpcReact.openDirOnExplorer.useMutation();
  const handleOpenFolder = () => {
    // photoItemList の中で imgPath を持つ最初の要素を取得し、それをエクスプローラで開く
    const havingImgPathItem = photoItemList
      ?.map((item) => item.join?.imgPath)
      .find((item) => item);
    if (!havingImgPathItem) return;
    openDirOnExplorerMutatation.mutate(havingImgPathItem);
  };

  return (
    <>
      <div className="flex-none shrink-0">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Join List</h1>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={handleOpenFolder}
          >
            エクスプローラで開く
          </Button>
        </div>
      </div>
      {photoItemFetchError !== null ? (
        <div className="flex justify-center items-center h-full">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-xl font-bold">設定を完了させてください</h1>
              <p>
                {photoItemFetchError.code} {photoItemFetchError.message}
              </p>
            </div>
            <div>
              <Link to={ROUTER_PATHS.SETTING} className="text-blue-500">
                設定画面へ
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea>
          <JoinInfoList joinInfoList={photoItemList} />
        </ScrollArea>
      )}
    </>
  );
};

interface RightPanelProps {
  selectedFolderYearMonth: { year: string; month: string };
  createJoinInfoSuccessCallback: () => void;
}
const RightPanel = ({
  selectedFolderYearMonth,
  createJoinInfoSuccessCallback,
}: RightPanelProps) => {
  if (
    selectedFolderYearMonth.month === '' ||
    selectedFolderYearMonth.year === ''
  ) {
    return <CreateJoinInfo successCallback={createJoinInfoSuccessCallback} />;
  }
  return (
    <JoinListComponent selectedFolderYearMonth={selectedFolderYearMonth} />
  );
};

interface PhotoListProps {
  firstYearMonth: { year: string; month: string };
  sortedYearMonthList: { year: string; month: string }[];
}
const PhotoList = ({ firstYearMonth, sortedYearMonthList }: PhotoListProps) => {
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] =
    useState(firstYearMonth);

  const handleSideBarClick = (key: string) => {
    const keyRegExp = /^\d{4}-\d{2}$/;
    if (!keyRegExp.test(key)) {
      setSelectedFolderYearMonth({
        year: '',
        month: '',
      });
      return;
    }
    const [year, month] = key.split('-');
    setSelectedFolderYearMonth({
      year,
      month,
    });
  };

  const defaultKey = React.useMemo(
    () =>
      sortedYearMonthList?.[0] &&
      `${sortedYearMonthList[0].year}-${sortedYearMonthList[0].month}`,
    [sortedYearMonthList],
  );

  const reloadWindoMutation = trpcReact.electronUtil.reloadWindow.useMutation();
  const reloadPage = () => {
    reloadWindoMutation.mutate();
  };

  return (
    <div className="h-full grid grid-cols-5 overflow-hidden">
      <ScrollArea className="grow">
        <Sidebar
          className="col-span-1 overflow-auto"
          clickCallback={handleSideBarClick}
          itemList={
            sortedYearMonthList?.map((folder) => ({
              key: `${folder.year}-${folder.month}`,
              label: `${folder.year}年${folder.month}月`,
            })) || []
          }
          defaultKey={defaultKey}
        />
      </ScrollArea>
      <div className="flex flex-col col-span-4 p-4 overflow-hidden">
        <RightPanel
          selectedFolderYearMonth={selectedFolderYearMonth}
          createJoinInfoSuccessCallback={reloadPage}
        />
      </div>
    </div>
  );
};

const JoinListWrapper = () => {
  const { sortedYearMonthList } = useYearMonthList();
  // useMemoを使用して、sortedYearMonthList?.[0]が変わらない限り、
  // firstYearMonthの参照が保持されるようにする
  const firstYearMonth = useMemo(() => {
    if (sortedYearMonthList === undefined) {
      return undefined;
    }
    if (sortedYearMonthList.length === 0) {
      return { year: '', month: '' };
    }
    return sortedYearMonthList[0];
  }, [
    sortedYearMonthList?.[0]?.year,
    sortedYearMonthList?.[0]?.month,
    sortedYearMonthList === undefined,
  ]);
  return (
    (firstYearMonth && sortedYearMonthList && (
      <PhotoList
        firstYearMonth={firstYearMonth}
        sortedYearMonthList={sortedYearMonthList}
      />
    )) || <div>loading...</div>
  );
};

const StatusCheckComponent = () => {
  const logFilesDirError =
    trpcReact.getVRChatLogFilesDir.useQuery().data?.error;
  const vrchatPhotoDirError =
    trpcReact.getVRChatPhotoDir.useQuery().data?.error;

  if (logFilesDirError === undefined || vrchatPhotoDirError === undefined) {
    return <div>loading...</div>;
  }

  if (logFilesDirError === null && vrchatPhotoDirError === null) {
    return <JoinListWrapper />;
  }

  const errorMessageList = [logFilesDirError, vrchatPhotoDirError]
    .map((error) =>
      match(error)
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
        .with(null, () => '')
        .exhaustive(),
    )
    .filter((error) => error !== '');

  return (
    <div className="flex justify-center items-center h-full">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">設定を完了させてください</h1>
          {errorMessageList.map((error) => (
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
  );
};

StatusCheckComponent.whyDidYouRender = true;

export default StatusCheckComponent;
