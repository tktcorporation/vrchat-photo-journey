import { trpcReact } from '@/trpc';
import React, { useEffect, useState } from 'react';

import Sidebar from '@/components/SideBar';
import VrcPhoto from '@/components/ui/VrcPhoto';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePhotoItems, useYearMonthList } from './composable';

const WorldInfo = ({
  vrcWorldId,
  datetime,
}: {
  vrcWorldId: string;
  datetime: Date;
}) => {
  const { data } = trpcReact.getVrcWorldInfoByWorldId.useQuery(vrcWorldId, {
    staleTime: 1000 * 60 * 5, // キャッシュの有効期限を5分に設定
    cacheTime: 1000 * 60 * 30, // キャッシュされたデータを30分間メモリに保持
  });
  console.log('datetime', data);
  const date = datetime;
  const dateToDisplay = `${date.getUTCFullYear()}/${
    date.getUTCMonth() + 1
  }/${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}`;
  const worldUrl = `https://vrchat.com/home/world/${vrcWorldId}`;
  return (
    <div>
      <p>
        <a href={worldUrl} target="_blank" rel="noreferrer">
          {data?.name ?? vrcWorldId}
        </a>
      </p>
      <p className="text-sm text-gray-500">Join: {dateToDisplay}</p>
    </div>
  );
};

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
                  // item.photoList がある場合は写真一覧を表示する
                  const photoList = item.photoList.map((photo) => (
                    <div
                      key={`photo-container-${photo.datetime.toISOString()}`}
                      className="col-span-1"
                    >
                      <VrcPhoto
                        key={photo.path}
                        photoPath={photo.path}
                        onClickPhoto={() => {
                          openPhotoPathMutation.mutate(photo.path);
                        }}
                      />
                    </div>
                  ));
                  return (
                    <>
                      <div
                        key={`world-info-${item.joinDatetime.toISOString()}`}
                        className="col-span-full"
                      >
                        <WorldInfo
                          vrcWorldId={item.worldId}
                          datetime={item.joinDatetime}
                        />
                      </div>
                      {photoList}
                    </>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

PhotoList.whyDidYouRender = true;

export default PhotoList;
