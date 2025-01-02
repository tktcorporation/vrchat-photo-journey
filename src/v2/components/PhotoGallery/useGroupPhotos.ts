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
  console.log('[useGroupPhotos] Input photos:', {
    length: photos.length,
    firstPhoto: photos[0],
    lastPhoto: photos[photos.length - 1],
    sampleDates: photos.slice(0, 3).map((p) => ({
      id: p.id,
      takenAt: p.takenAt.toISOString(),
    })),
  });

  const { data: joinLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      {
        gtJoinDateTime:
          photos.length > 0
            ? new Date(
                Math.min(...photos.map((p) => p.takenAt.getTime())) -
                  24 * 60 * 60 * 1000,
              )
            : undefined,
        ltJoinDateTime:
          photos.length > 0
            ? new Date(
                Math.max(...photos.map((p) => p.takenAt.getTime())) +
                  24 * 60 * 60 * 1000,
              )
            : undefined,
        orderByJoinDateTime: 'desc',
      },
      {
        staleTime: 1000 * 60 * 30, // 30分間キャッシュ
        cacheTime: 1000 * 60 * 60, // 1時間キャッシュを保持
        retry: 3, // エラー時に3回まで再試行
        retryDelay: 1000, // 再試行間隔を1秒に設定
      },
    );

  const sessions = useMemo(() => {
    if (!joinLogs) {
      console.log('[useGroupPhotos] No join logs available');
      return [];
    }

    console.log('[useGroupPhotos] Join logs:', {
      count: joinLogs.length,
      firstLog: joinLogs[0],
      lastLog: joinLogs[joinLogs.length - 1],
      timeRange:
        joinLogs.length > 0
          ? {
              first: new Date(joinLogs[0].joinDateTime).toISOString(),
              last: new Date(
                joinLogs[joinLogs.length - 1].joinDateTime,
              ).toISOString(),
            }
          : null,
      sampleLogs: joinLogs.slice(0, 3).map((log) => ({
        worldId: log.worldId,
        worldName: log.worldName,
        joinDateTime: new Date(log.joinDateTime).toISOString(),
      })),
    });
    return joinLogs.map((log, index) => ({
      worldId: log.worldId,
      worldName: log.worldName,
      worldInstanceId: log.worldInstanceId,
      joinDateTime: log.joinDateTime,
      nextJoinDateTime: joinLogs[index + 1]?.joinDateTime,
    }));
  }, [joinLogs]);

  const photoGroups = useMemo(() => {
    if (!sessions.length) return {} as GroupedPhotos;

    console.log('[useGroupPhotos] Processing photos:', {
      totalPhotos: photos.length,
      sessionsCount: sessions.length,
    });

    const groups: GroupedPhotos = {};
    // 写真を撮影時刻の昇順でソート
    const sortedPhotos = [...photos].sort(
      (a, b) => a.takenAt.getTime() - b.takenAt.getTime(),
    );

    console.log('[useGroupPhotos] Time range:', {
      oldest:
        sortedPhotos.length > 0
          ? new Date(sortedPhotos[0].takenAt).toISOString()
          : null,
      newest:
        sortedPhotos.length > 0
          ? new Date(
              sortedPhotos[sortedPhotos.length - 1].takenAt,
            ).toISOString()
          : null,
    });

    // セッションを時刻の降順でソート（新しい順）
    const sortedSessions = [...sessions].sort(
      (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
    );

    let remainingPhotos = [...sortedPhotos];
    let ungroupedCount = 0;

    // 各セッションに対して写真をグループ化
    for (const session of sortedSessions) {
      // このセッション以降に撮影された写真を取得
      const sessionPhotos = remainingPhotos.filter(
        (photo) => photo.takenAt.getTime() >= session.joinDateTime.getTime(),
      );

      if (sessionPhotos.length > 0) {
        const groupKey = `${
          session.worldInstanceId
        }/${session.joinDateTime.getTime()}`;
        groups[groupKey] = {
          photos: sessionPhotos,
          worldId: session.worldId,
          worldName: session.worldName,
          worldInstanceId: session.worldInstanceId,
          joinDateTime: session.joinDateTime,
        };
      }

      // 残りの写真を更新
      remainingPhotos = remainingPhotos.filter(
        (photo) => photo.takenAt.getTime() < session.joinDateTime.getTime(),
      );
    }

    // グループ化されなかった写真の処理
    ungroupedCount = remainingPhotos.length;
    if (remainingPhotos.length > 0 && sortedSessions.length > 0) {
      // 最も古いセッションに追加
      const oldestSession = sortedSessions[sortedSessions.length - 1];
      const groupKey = `${
        oldestSession.worldInstanceId
      }/${oldestSession.joinDateTime.getTime()}`;

      if (groups[groupKey]) {
        groups[groupKey].photos.push(...remainingPhotos);
      } else {
        groups[groupKey] = {
          photos: remainingPhotos,
          worldId: oldestSession.worldId,
          worldName: oldestSession.worldName,
          worldInstanceId: oldestSession.worldInstanceId,
          joinDateTime: oldestSession.joinDateTime,
        };
      }
    }

    console.log('[useGroupPhotos] Grouping results:', {
      totalGroups: Object.keys(groups).length,
      ungroupedPhotos: ungroupedCount,
      groupedPhotos: Object.values(groups).reduce(
        (acc, g) => acc + g.photos.length,
        0,
      ),
    });

    return groups;
  }, [sessions, photos]);

  return photoGroups;
}
