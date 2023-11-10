import React, { useEffect } from 'react';
import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Sidebar from '@/components/SideBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppRouter } from 'electron/api';
import Photo from '@/components/ui/Photo';

type YearMonth = {
  year: string;
  month: string;
};

function PhotoList() {
  const { data: yearMonthList, refetch: refetchYearMonthList } = trpcReact.getVRChatPhotoFolderYearMonthList.useQuery();
  const sortedYearMonthList = yearMonthList?.sort((a, b) => {
    const yearMonthA = a.year + a.month;
    const yearMonthB = b.year + b.month;
    return yearMonthB.localeCompare(yearMonthA);
  });
  const firstYearMonth = sortedYearMonthList?.[0];
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] = React.useState<YearMonth | undefined>(firstYearMonth);
  const [photoItemList, setPhotoItemList] =
    React.useState<inferProcedureOutput<AppRouter['getVRChatPhotoWithWorldIdAndDate']>>();
  const [refetchPhotoItemList, setRefetchPhotoItemList] =
    React.useState<ReturnType<typeof trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery>['refetch']>();

  // useEffectを使用して、yearMonthListが更新されたらselectedFolderYearMonthを更新します。
  useEffect(() => {
    if (yearMonthList) {
      setSelectedFolderYearMonth(firstYearMonth);
    }
  }, [yearMonthList]);

  const photoItemListQuery = trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery(selectedFolderYearMonth!, {
    enabled: !!selectedFolderYearMonth
  });

  useEffect(() => {
    if (photoItemListQuery.data) {
      setPhotoItemList(photoItemListQuery.data);
    }
    // refetch関数を状態に保存します。
    setRefetchPhotoItemList(() => () => photoItemListQuery.refetch());
  }, [photoItemListQuery.data, photoItemListQuery.refetch]);

  const handleSideBarClick = (key: string) => {
    const [year, month] = key.split('-');
    setSelectedFolderYearMonth({
      year,
      month
    });
    // データを更新するためにrefetch関数を呼び出すことができます。
    refetchPhotoItemList?.();
  };

  const mutate = trpcReact.openPathOnExplorer.useMutation();
  const handleOpenFolder = () => {
    console.log(photoItemList?.[0].path);
    return photoItemList && mutate.mutate(photoItemList[0].path);
  };

  return (
    <div className="h-screen grid grid-cols-5 overflow-hidden">
      <Sidebar
        className="col-span-1 overflow-auto"
        clickCallback={handleSideBarClick}
        itemList={
          sortedYearMonthList?.map((folder) => ({
            key: `${folder.year}-${folder.month}`,
            label: `${folder.year}年${folder.month}月`
          })) || []
        }
        defaultKey={sortedYearMonthList?.[0] && `${sortedYearMonthList[0].year}-${sortedYearMonthList[0].month}`}
      />
      <div className="flex flex-col col-span-4 p-4 overflow-hidden">
        <div className="flex-none shrink-0">
          <div className="flex items-center">
            <Button
              className="inline"
              variant="ghost"
              onClick={() => refetchPhotoItemList?.() && refetchYearMonthList()}
            >
              <RefreshCw className="inline-block" />
            </Button>
            <h1 className="text-2xl font-bold">Photo</h1>
            <Button variant="ghost" className="ml-auto" onClick={handleOpenFolder}>
              エクスプローラで開く
            </Button>
          </div>
        </div>
        {/* 画面サイズからはみ出さないようにする */}
        <ScrollArea className="grow">
          <div className="col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              {photoItemList &&
                photoItemList.map((item) => {
                  const content =
                    item.type === 'PHOTO' ? <Photo photoPath={item.path} /> : <Photo photoPath={item.path} />;

                  return <div key={item.path}>{content}</div>;
                })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default PhotoList;
