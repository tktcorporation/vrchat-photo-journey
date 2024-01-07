import { trpcReact } from '@/trpc';
import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '@/components/SideBar';
import Photo from '@/components/ui/Photo';
import VrcPhoto from '@/components/ui/VrcPhoto';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePhotoItems, useYearMonthList } from './composable';

function PhotoList() {
  const { sortedYearMonthList, refetchYearMonthList } = useYearMonthList();
  const firstYearMonth = useMemo(
    () => sortedYearMonthList?.[0] || { year: '', month: '' },
    [sortedYearMonthList],
  );
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] =
    useState(firstYearMonth);
  useEffect(() => {
    setSelectedFolderYearMonth(firstYearMonth);
  }, [firstYearMonth]);

  const { photoItemList, photoItemFetchError, refetchPhotoItemList } =
    usePhotoItems(selectedFolderYearMonth);

  const handleSideBarClick = (key: string) => {
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
      openDirOnExplorerMutatation.mutate(photoItemList[0].path)
    );
  };

  const defaultKey = React.useMemo(
    () =>
      sortedYearMonthList?.[0] &&
      `${sortedYearMonthList[0].year}-${sortedYearMonthList[0].month}`,
    [sortedYearMonthList],
  );

  const openPhotoPathMutation = trpcReact.openPathOnExplorer.useMutation();

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
            <h1 className="text-2xl font-bold">Photo</h1>
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
            <div className="col-span-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                {photoItemList?.map((item) => {
                  // TODO: join だけだったら簡易表示、photo もあればグルーピングして表示
                  const content =
                    item.type === 'PHOTO' ? (
                      <VrcPhoto
                        photoPath={item.path}
                        onClickPhoto={() => {
                          openPhotoPathMutation.mutate(item.path);
                        }}
                      />
                    ) : (
                      <Photo photoPath={item.path} />
                    );

                  return <div key={item.path}>{content}</div>;
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export default PhotoList;
