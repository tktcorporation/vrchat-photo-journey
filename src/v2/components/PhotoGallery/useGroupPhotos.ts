import { trpcReact } from '@/trpc';
import { useMemo } from 'react';
import type { Photo } from '../../types/photo';

export interface GroupedPhoto {
  photos: Photo[];
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
}

export type GroupedPhotos = Record<string, GroupedPhoto>;

export function useGroupPhotos(photos: Photo[]) {
  const { data: joinLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery({
      orderByJoinDateTime: 'desc',
    });

  return useMemo(() => {
    if (!joinLogs) return {} as GroupedPhotos;

    // 日付でソート（新しい順）
    const sorted = [...photos].sort(
      (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
    );

    return sorted.reduce<GroupedPhotos>((groups, photo) => {
      // 写真の撮影時刻以前の最新のjoinLogを探す
      const joinLog = joinLogs.find(
        (log) => log.joinDateTime.getTime() <= photo.takenAt.getTime(),
      );

      if (!joinLog) return groups;

      const groupKey = `${
        joinLog.worldInstanceId
      }/${joinLog.joinDateTime.getTime()}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          photos: [],
          worldId: joinLog.worldId,
          worldName: joinLog.worldName,
          worldInstanceId: joinLog.worldInstanceId,
          joinDateTime: joinLog.joinDateTime,
        };
      }

      groups[groupKey].photos.push(photo);
      return groups;
    }, {});
  }, [photos, joinLogs]);
}
