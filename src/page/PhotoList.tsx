import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';
import React, { useEffect } from 'react';

import Sidebar from '@/components/SideBar';
import Photo from '@/components/ui/Photo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { AppRouter } from 'electron/api';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

type YearMonth = {
  year: string;
  month: string;
};

function PhotoList() {
  const { data: yearMonthList, refetch: refetchYearMonthList } =
    trpcReact.getVRChatPhotoFolderYearMonthList.useQuery();
  const sortedYearMonthList = yearMonthList?.sort((a, b) => {
    const yearMonthA = a.year + a.month;
    const yearMonthB = b.year + b.month;
    return yearMonthB.localeCompare(yearMonthA);
  });
  const firstYearMonth = React.useMemo(
    () => sortedYearMonthList?.[0],
    [sortedYearMonthList],
  ) ?? { year: '', month: '' };
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] =
    React.useState<YearMonth>(firstYearMonth);
  const [photoItemList, setPhotoItemList] =
    React.useState<
      inferProcedureOutput<
        AppRouter['getVRChatPhotoWithWorldIdAndDate']
      >['data']
    >();
  const [photoItemFetchError, setPhotoItemFetchError] =
    React.useState<
      inferProcedureOutput<
        AppRouter['getVRChatPhotoWithWorldIdAndDate']
      >['error']
    >(null);
  const sortedPhotoItemList = photoItemList?.sort((a, b) => {
    if (!a || !b) return 0;
    const datetimeA =
      a.datetime.date.year +
      a.datetime.date.month +
      a.datetime.date.day +
      a.datetime.time.hour +
      a.datetime.time.minute +
      a.datetime.time.second +
      a.datetime.time.millisecond;
    const datetimeB =
      b.datetime.date.year +
      b.datetime.date.month +
      b.datetime.date.day +
      b.datetime.time.hour +
      b.datetime.time.minute +
      b.datetime.time.second +
      b.datetime.time.millisecond;
    // 降順に並び替える
    return datetimeB.localeCompare(datetimeA);
  });

  const [refetchPhotoItemList, setRefetchPhotoItemList] =
    React.useState<
      ReturnType<
        typeof trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery
      >['refetch']
    >();

  // useEffectを使用して、yearMonthListが更新されたらselectedFolderYearMonthを更新します。
  useEffect(() => {
    if (yearMonthList) {
      setSelectedFolderYearMonth(firstYearMonth);
    }
  }, [yearMonthList, setSelectedFolderYearMonth, firstYearMonth]);

  const photoItemListQuery =
    trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery(
      selectedFolderYearMonth,
      {
        enabled: !!(
          selectedFolderYearMonth.year && selectedFolderYearMonth.month
        ),
      },
    );

  useEffect(() => {
    const { data } = photoItemListQuery;
    setPhotoItemList(data?.data);
    setPhotoItemFetchError(data?.error ?? null);

    // refetch関数を状態に保存します。
    setRefetchPhotoItemList(() => () => photoItemListQuery.refetch());
  }, [
    photoItemListQuery,
    setRefetchPhotoItemList,
    setPhotoItemList,
    setPhotoItemFetchError,
  ]);

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
              onClick={() => refetchPhotoItemList?.() && refetchYearMonthList()}
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
                {sortedPhotoItemList?.map((item) => {
                  const content =
                    item.type === 'PHOTO' ? (
                      <Photo photoPath={item.path} />
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
