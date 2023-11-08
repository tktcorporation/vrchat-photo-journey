import React, { useEffect } from 'react';
import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Sidebar from '@/components/SideBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppRouter } from 'electron/api';

type YearMonth = {
  year: string;
  month: string;
};

function PhotoList() {
  const { data: yearMonthList, refetch: refetchYearMonthList } = trpcReact.getVRChatPhotoFolderYearMonthList.useQuery();
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] = React.useState<YearMonth | undefined>(undefined);
  const [photoItemDataList, setPhotoItemDataList] = React.useState<{ path: string; dataImage: string }[] | undefined>(
    undefined
  );
  const [photoItemList, setPhotoItemList] =
    React.useState<inferProcedureOutput<AppRouter['getVRChatPhotoWithWorldIdAndDate']>>();
  const [refetchPhotoItemDataList, setRefetchPhotoItemDataList] = React.useState<
    ReturnType<typeof trpcReact.getVRChatPhotoItemDataListByYearMonth.useQuery>['refetch'] | undefined
  >(undefined);

  // useEffectを使用して、yearMonthListが更新されたらselectedFolderYearMonthを更新します。
  useEffect(() => {
    if (yearMonthList) {
      setSelectedFolderYearMonth(yearMonthList.sort((a, b) => (a.year > b.year ? -1 : 1))[0]);
    }
  }, [yearMonthList]);

  // 写真データを取得するためのクエリを初期化します。
  const photoItemDataListQuery = trpcReact.getVRChatPhotoItemDataListByYearMonth.useQuery(selectedFolderYearMonth!, {
    // オプションを設定して、選択されたフォルダがundefinedの場合にはクエリを実行しないようにすることができます。
    enabled: !!selectedFolderYearMonth
  });
  const photoItemListQuery = trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery(selectedFolderYearMonth!, {
    enabled: !!selectedFolderYearMonth
  });

  useEffect(() => {
    if (photoItemDataListQuery.data) {
      setPhotoItemDataList(photoItemDataListQuery.data);
    }
    if (photoItemListQuery.data) {
      setPhotoItemList(photoItemListQuery.data);
    }
    // refetch関数を状態に保存します。
    setRefetchPhotoItemDataList(() => photoItemDataListQuery.refetch);
  }, [photoItemDataListQuery.data, photoItemDataListQuery.refetch]);

  const handleSideBarClick = (key: string) => {
    const [year, month] = key.split('-');
    setSelectedFolderYearMonth({
      year,
      month
    });
    // データを更新するためにrefetch関数を呼び出すことができます。
    refetchPhotoItemDataList?.();
  };

  return (
    <div className="h-screen grid grid-cols-5 overflow-hidden">
      <Sidebar
        className="col-span-1 overflow-auto"
        clickCallback={handleSideBarClick}
        itemList={
          yearMonthList?.map((folder) => ({
            key: `${folder.year}-${folder.month}`,
            label: `${folder.year}年${folder.month}月`
          })) || []
        }
      />
      <div className="flex flex-col col-span-4 p-4 overflow-hidden">
        <div className="flex-none shrink-0">
          <h1 className="text-2xl font-bold">Photo</h1>
          {photoItemDataList?.length}

          <Button variant="outline" onClick={() => refetchPhotoItemDataList?.() && refetchYearMonthList()}>
            <RefreshCw className="w-6 h-6 inline-block" />
            再読み込み
          </Button>
        </div>
        {/* 画面サイズからはみ出さないようにする */}
        <ScrollArea className="grow">
          <div className="col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              {photoItemDataList &&
                photoItemDataList.map((data) => (
                  <div key={data.path}>
                    {' '}
                    {/* margin-bottomは各アイテムの間隔を調整するために使用 */}
                    <img src={data.dataImage} alt={`VRChatの写真: file:/${data.path}`} className="w-full h-auto" />{' '}
                    {/* 画像の横幅はコンテナに合わせ、縦横比を保つ */}
                  </div>
                ))}
              {photoItemList && photoItemList.map((item) => <div key={item.path}>{JSON.stringify(item)}</div>)}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default PhotoList;
