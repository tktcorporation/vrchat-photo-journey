import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { ROUTER_PATHS } from '@/constants';
import { Button } from '@/components/ui/button';
import { RecycleIcon } from 'lucide-react';
import Sidebar from '@/components/SideBar';

type YearMonth = {
  year: string;
  month: string;
};

function Setting() {
  const { data: yearMonthList, refetch: refetchYearMonthList } = trpcReact.getVRChatPhotoFolderYearMonthList.useQuery();
  const [selectedFolderYearMonth, setSelectedFolderYearMonth] = React.useState<YearMonth | undefined>(undefined);
  const [photoItemDataList, setPhotoItemDataList] = React.useState<{ path: string; dataImage: string }[] | undefined>(
    undefined
  );
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

  useEffect(() => {
    if (photoItemDataListQuery.data) {
      setPhotoItemDataList(photoItemDataListQuery.data);
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
    <div className="flex-auto">
      <div className="border-t">
        <div className="bg-background">
          <div className="grid grid-cols-5">
            <Sidebar
              className=""
              clickCallback={handleSideBarClick}
              itemList={
                yearMonthList?.map((folder) => ({
                  key: `${folder.year}-${folder.month}`,
                  label: `${folder.year}年${folder.month}月`
                })) || []
              }
            />
            <div className="col-span-4 p-4">
              <h1 className="text-2xl font-bold">Photo</h1>
              <div className="grid grid-cols-3 gap-4">
                {photoItemDataList &&
                  photoItemDataList.map((data) => (
                    <div key={data.path} className="bg-gray-100 grid-span-1">
                      <img src={data.dataImage} alt={`VRChatの写真: file:/${data.path}`} />
                    </div>
                  ))}
              </div>
              {photoItemDataList?.length}

              <Button variant="outline" onClick={() => refetchPhotoItemDataList?.() && refetchYearMonthList()}>
                <RecycleIcon className="w-6 h-6 inline-block" />
                再読み込み
              </Button>

              <Link to={ROUTER_PATHS.HOME}>
                <Button variant="outline">HOME</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setting;
