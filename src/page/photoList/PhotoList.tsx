import { trpcReact } from '@/trpc';
import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '@/components/SideBar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTER_PATHS } from '@/constants';
import { Link } from 'react-router-dom';
import { CreateJoinInfo } from './CreateJoinInfo';
import { PhotoItemList } from './PhotoItemList';
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
    return (
      photoItemList?.[0] &&
      openDirOnExplorerMutatation.mutate(photoItemList[0].imgPath)
    );
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
          <PhotoItemList photoItemList={photoItemList} />
        </ScrollArea>
      )}
    </>
  );
};

interface RightPanelProps {
  selectedFolderYearMonth: { year: string; month: string };
}
const RightPanel = ({ selectedFolderYearMonth }: RightPanelProps) => {
  const [selectedComponentKey, setSelectedComponentKey] = useState<
    'joinList' | 'createJoinInfo'
  >('createJoinInfo');

  useEffect(() => {
    if (
      selectedFolderYearMonth.month === '' ||
      selectedFolderYearMonth.year === ''
    ) {
      setSelectedComponentKey('createJoinInfo');
      return;
    }
    setSelectedComponentKey('joinList');
  }, [selectedFolderYearMonth.month, selectedFolderYearMonth.year]);

  if (selectedComponentKey === 'joinList') {
    return (
      <JoinListComponent selectedFolderYearMonth={selectedFolderYearMonth} />
    );
  }
  return <CreateJoinInfo />;
};

interface PhotoListProps {
  firstYearMonth: { year: string; month: string };
  sortedYearMonthList: { year: string; month: string }[];
}
const PhotoList = ({ firstYearMonth, sortedYearMonthList }: PhotoListProps) => {
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] =
    useState(firstYearMonth);

  const handleSideBarClick = (key: string) => {
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
        {(firstYearMonth && (
          <RightPanel selectedFolderYearMonth={selectedFolderYearMonth} />
        )) || <div>loading...</div>}
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

JoinListWrapper.whyDidYouRender = true;

export default JoinListWrapper;
