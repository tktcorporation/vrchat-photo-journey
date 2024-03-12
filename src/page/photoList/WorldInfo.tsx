import { trpcReact } from '@/trpc';
import React from 'react';

import { Button } from '@/components/ui/button';

export const WorldInfo = ({
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
  const openUrlMutation =
    trpcReact.electronUtil.openUrlInDefaultBrowser.useMutation();
  const onClickWorldUrl = () => {
    openUrlMutation.mutate(worldUrl);
  };
  return (
    <div>
      <p className="font-medium">
        <Button onClick={onClickWorldUrl} variant="link" className="px-0">
          {data?.name ?? vrcWorldId}
        </Button>
      </p>
      <p className="text-sm text-gray-500">Join: {dateToDisplay}</p>
    </div>
  );
};
