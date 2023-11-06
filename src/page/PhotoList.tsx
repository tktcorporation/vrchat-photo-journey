import React from 'react';
import { Link } from 'react-router-dom';
import { trpcReact } from '@/trpc';
import { ROUTER_PATHS } from '@/constants';
import { Button } from '@/components/ui/button';
import { RecycleIcon } from 'lucide-react';

function Setting() {
  // 初期表示時に log-files-dir を取得する
  const phototItemDataListQuery = trpcReact.getVRChatPhotoItemDataListByYearMonth.useQuery({
    year: '2023',
    month: '10'
  });
  const { data: photoItemDataList, refetch } = phototItemDataListQuery;

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-8">
        <h3 className="text-lg font-medium">設定</h3>
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 space-x-4">
            {photoItemDataList &&
              photoItemDataList.map((data) => (
                <div className="w-64 bg-gray-100" key={data.path}>
                  <img src={data.dataImage} alt={`VRChatの写真: file:/${data.path}`} />
                </div>
              ))}
          </div>
          {photoItemDataList?.length}
        </div>

        <Button variant="outline" onClick={() => refetch()}>
          <RecycleIcon className="w-6 h-6 inline-block" />
          再読み込み
        </Button>

        <Link to={ROUTER_PATHS.HOME}>
          <Button variant="outline">HOME</Button>
        </Link>
      </div>
    </div>
  );
}

export default Setting;
