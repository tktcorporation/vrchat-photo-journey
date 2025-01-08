import { trpcReact } from '@/trpc';
import { useMemo } from 'react';
import type { Photo } from '../../types/photo';

export interface WorldInfo {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
}

export interface GroupedPhoto {
  photos: Photo[];
  worldInfo: WorldInfo | null;
  joinDateTime: Date;
}

export type GroupedPhotos = Record<string, GroupedPhoto>;

export interface WorldJoinLog {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
}

export interface DebugInfo {
  totalPhotos: number;
  totalGroups: number;
}

// 写真をワールドセッションごとにグループ化する純粋な関数
export function groupPhotosBySession(
  photos: Photo[],
  joinLogs: WorldJoinLog[],
): GroupedPhoto[] {
  if (photos.length === 0 || joinLogs.length === 0) {
    return [];
  }

  // 写真を新しい順にソート
  const sortedPhotos = [...photos].sort(
    (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
  );

  // joinLogsを新しい順にソート
  const sortedLogs = [...joinLogs].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  // 各セッションに対してグループを作成
  const groups: GroupedPhoto[] = sortedLogs.map((session) => ({
    photos: [],
    worldInfo: {
      worldId: session.worldId,
      worldName: session.worldName,
      worldInstanceId: session.worldInstanceId,
    },
    joinDateTime: session.joinDateTime,
  }));

  // 各写真を適切なグループに割り当て
  for (const photo of sortedPhotos) {
    const photoTime = photo.takenAt.getTime();

    // 写真の時間以前の最も近いセッションを探す
    let bestGroupIndex = -1;
    let minTimeDiff = Number.POSITIVE_INFINITY;

    for (let i = 0; i < sortedLogs.length; i++) {
      const sessionTime = sortedLogs[i].joinDateTime.getTime();
      const timeDiff = photoTime - sessionTime;

      // 写真の時間以前で最も近いセッションを選択
      if (timeDiff >= 0 && timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        bestGroupIndex = i;
      }
    }

    // 適切なセッションが見つからない場合は、時間的に最も近いセッションを探す
    if (bestGroupIndex === -1) {
      minTimeDiff = Number.POSITIVE_INFINITY;
      for (let i = 0; i < sortedLogs.length; i++) {
        const sessionTime = sortedLogs[i].joinDateTime.getTime();
        const timeDiff = Math.abs(sessionTime - photoTime);

        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          bestGroupIndex = i;
        }
      }
    }

    // 写真をグループに追加
    if (bestGroupIndex !== -1) {
      groups[bestGroupIndex].photos.push(photo);
    }
  }

  // 各グループの写真を時間順にソート
  for (const group of groups) {
    group.photos.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
  }

  return groups;
}

// グループ化された写真をRecordに変換する
function convertGroupsToRecord(groups: GroupedPhoto[]): GroupedPhotos {
  return groups.reduce<GroupedPhotos>((acc, group) => {
    const key = group.worldInfo
      ? `${group.worldInfo.worldId}/${group.joinDateTime.getTime()}`
      : `ungrouped/${group.joinDateTime.getTime()}`;
    acc[key] = group;
    return acc;
  }, {});
}

export function useGroupPhotos(photos: Photo[]): {
  groupedPhotos: GroupedPhotos;
  isLoading: boolean;
  debug: DebugInfo;
} {
  const { data: joinLogs, isLoading: isLoadingLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      {
        orderByJoinDateTime: 'desc',
      },
      {
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60,
      },
    );

  const groupedPhotos = useMemo(() => {
    if (!joinLogs || isLoadingLogs) return {};
    const groups = groupPhotosBySession(photos, joinLogs);
    return convertGroupsToRecord(groups);
  }, [photos, joinLogs, isLoadingLogs]);

  const debug: DebugInfo = {
    totalPhotos: photos.length,
    totalGroups: Object.keys(groupedPhotos).length,
  };

  return {
    groupedPhotos,
    isLoading: isLoadingLogs,
    debug,
  };
}
