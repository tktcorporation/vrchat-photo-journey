import { trpcReact } from '@/trpc';
import * as dateFns from 'date-fns';

import { Button } from '@/components/ui/button';

export const WorldInfo = ({
  vrcWorldId,
  datetime,
}: {
  vrcWorldId: string | null;
  datetime: Date | null;
}) => {
  // world name
  const worldName =
    vrcWorldId &&
    trpcReact.getVrcWorldInfoByWorldId.useQuery(vrcWorldId, {
      staleTime: 1000 * 60 * 5, // キャッシュの有効期限を5分に設定
      cacheTime: 1000 * 60 * 30, // キャッシュされたデータを30分間メモリに保持
    }).data?.name;
  const displayWorldName = worldName ?? vrcWorldId ?? 'Unknown';

  // join datetime
  const date = datetime;
  const dateToDisplay = date
    ? dateFns.format(date, 'yyyy/MM/dd HH:mm')
    : 'Unknown';

  const openUrlMutation =
    trpcReact.electronUtil.openUrlInDefaultBrowser.useMutation();
  const onClickWorldUrl = () => {
    if (!vrcWorldId) return;
    const worldUrl = `https://vrchat.com/home/world/${vrcWorldId}`;
    openUrlMutation.mutate(worldUrl);
  };
  return (
    <div>
      <p className="font-medium">
        <Button onClick={onClickWorldUrl} variant="link" className="px-0">
          {displayWorldName}
        </Button>
      </p>
      <p className="text-sm text-gray-500">Join: {dateToDisplay}</p>
    </div>
  );
};
