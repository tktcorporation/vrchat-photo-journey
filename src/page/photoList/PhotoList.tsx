import { trpcReact } from '@/trpc';
import React, { useEffect, useState } from 'react';

import Sidebar from '@/components/SideBar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PhotoItemList } from './PhotoItemList';
import { usePhotoItems, useYearMonthList } from './composable';

const PhotoList = () => {
  const { sortedYearMonthList, refetchYearMonthList } = useYearMonthList();
  const firstYearMonth = sortedYearMonthList?.[0] || { year: '', month: '' };
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] =
    useState(firstYearMonth);
  useEffect(() => {
    setSelectedFolderYearMonth(firstYearMonth);
  }, [firstYearMonth]);

  const { photoItemList, photoItemFetchError, refetchPhotoItemList } =
    usePhotoItems(selectedFolderYearMonth);

  const handleSideBarClick = (key: string) => {
    // TODO: Newの表示
    if (key === '') {
      // TODO: Newの表示
    }

    const [year, month] = key.split('-');
    setSelectedFolderYearMonth({
      year,
      month,
    });
    // データを更新するためにrefetch関数を呼び出すことができます。
    refetchPhotoItemList?.();
  };

  const openDirOnExplorerMutatation = trpcReact.openDirOnExplorer.useMutation();
  const handleOpenFolder = () => {
    return (
      photoItemList?.[0] &&
      openDirOnExplorerMutatation.mutate(photoItemList[0].imgPath)
    );
  };

  const defaultKey = React.useMemo(
    () =>
      sortedYearMonthList?.[0] &&
      `${sortedYearMonthList[0].year}-${sortedYearMonthList[0].month}`,
    [sortedYearMonthList],
  );

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
        <div className="flex-none shrink-0">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Join List</h1>
            <Button
              className="inline"
              variant="ghost"
              onClick={() => {
                refetchPhotoItemList();
                refetchYearMonthList();
              }}
            >
              <RefreshCw className="inline-block" />
            </Button>
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={handleOpenFolder}
            >
              エクスプローラで開く
            </Button>
          </div>
        </div>
        {/* 画面サイズからはみ出さないようにする */}
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
            <PhotoItemList photoItemList={photoItemList} />
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

PhotoList.whyDidYouRender = true;

export default PhotoList;
