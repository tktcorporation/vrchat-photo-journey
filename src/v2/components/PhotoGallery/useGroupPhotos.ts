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

interface JoinSession {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  nextJoinDateTime?: Date;
}

export function useGroupPhotos(photos: Photo[]) {
  const { data: joinLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery({
      orderByJoinDateTime: 'desc',
    });

  return useMemo(() => {
    if (!joinLogs) return {} as GroupedPhotos;

    // joinログをセッションに変換
    const sessions: JoinSession[] = joinLogs.map((log, index) => ({
      worldId: log.worldId,
      worldName: log.worldName,
      worldInstanceId: log.worldInstanceId,
      joinDateTime: log.joinDateTime,
      // 次のjoinログの時刻を終了時刻として設定
      nextJoinDateTime: joinLogs[index + 1]?.joinDateTime,
    }));

    // 日付でソート（新しい順）
    const sorted = [...photos].sort(
      (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
    );

    return sorted.reduce<GroupedPhotos>((groups, photo) => {
      // 写真の撮影時刻を含むセッションを探す
      const session = sessions.find(
        (s) =>
          s.joinDateTime.getTime() <= photo.takenAt.getTime() &&
          (!s.nextJoinDateTime ||
            s.nextJoinDateTime.getTime() > photo.takenAt.getTime()),
      );

      if (!session) return groups;

      const groupKey = `${
        session.worldInstanceId
      }/${session.joinDateTime.getTime()}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          photos: [],
          worldId: session.worldId,
          worldName: session.worldName,
          worldInstanceId: session.worldInstanceId,
          joinDateTime: session.joinDateTime,
        };
      }

      groups[groupKey].photos.push(photo);
      return groups;
    }, {});
  }, [photos, joinLogs]);
}
