import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../types/photo';

export interface GroupedPhoto {
  photos: Photo[];
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
}

export type GroupedPhotos = Record<string, GroupedPhoto>;

const BATCH_SIZE = 50; // 一度に処理する写真の数

export function useGroupPhotos(photos: Photo[]): GroupedPhotos {
  const [processedCount, setProcessedCount] = useState(0);
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos>({});
  const processingRef = useRef(false);

  // 写真を時系列で並べ替え
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => a.takenAt.getTime() - b.takenAt.getTime(),
    );
  }, [photos]);

  // 現在のバッチの時間範囲を計算
  const timeRange = useMemo(() => {
    if (processedCount >= photos.length) return null;

    const currentBatch = sortedPhotos.slice(
      processedCount,
      processedCount + BATCH_SIZE,
    );

    return {
      gtJoinDateTime: new Date(
        Math.min(...currentBatch.map((p) => p.takenAt.getTime())) -
          24 * 60 * 60 * 1000,
      ),
      ltJoinDateTime: new Date(
        Math.max(...currentBatch.map((p) => p.takenAt.getTime())) +
          24 * 60 * 60 * 1000,
      ),
    };
  }, [sortedPhotos, processedCount]);

  // 現在のバッチのワールド参加ログを取得
  const { data: joinLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      timeRange
        ? {
            gtJoinDateTime: timeRange.gtJoinDateTime,
            ltJoinDateTime: timeRange.ltJoinDateTime,
            orderByJoinDateTime: 'desc',
          }
        : {
            gtJoinDateTime: new Date(),
            ltJoinDateTime: new Date(),
            orderByJoinDateTime: 'desc',
          },
      {
        enabled: !!timeRange,
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60,
      },
    );

  // バッチ処理の実行
  const processBatch = useCallback(() => {
    if (!joinLogs || processingRef.current) return;
    processingRef.current = true;

    const currentBatch = sortedPhotos.slice(
      processedCount,
      processedCount + BATCH_SIZE,
    );

    const sessions = joinLogs
      .map((log, index) => ({
        worldId: log.worldId,
        worldName: log.worldName,
        worldInstanceId: log.worldInstanceId,
        joinDateTime: log.joinDateTime,
        nextJoinDateTime: joinLogs[index + 1]?.joinDateTime,
      }))
      .sort((a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime());

    // 現在のバッチの写真をグループ化
    const newGroups: GroupedPhotos = { ...groupedPhotos };
    let remainingPhotos = [...currentBatch];

    for (const session of sessions) {
      const sessionPhotos = remainingPhotos.filter(
        (photo) => photo.takenAt.getTime() >= session.joinDateTime.getTime(),
      );

      if (sessionPhotos.length > 0) {
        const groupKey = `${
          session.worldInstanceId
        }/${session.joinDateTime.getTime()}`;

        if (newGroups[groupKey]) {
          newGroups[groupKey].photos.push(...sessionPhotos);
        } else {
          newGroups[groupKey] = {
            photos: sessionPhotos,
            worldId: session.worldId,
            worldName: session.worldName,
            worldInstanceId: session.worldInstanceId,
            joinDateTime: session.joinDateTime,
          };
        }
      }

      remainingPhotos = remainingPhotos.filter(
        (photo) => photo.takenAt.getTime() < session.joinDateTime.getTime(),
      );
    }

    // 残りの写真を最も古いセッションに追加
    if (remainingPhotos.length > 0 && sessions.length > 0) {
      const oldestSession = sessions[sessions.length - 1];
      const groupKey = `${
        oldestSession.worldInstanceId
      }/${oldestSession.joinDateTime.getTime()}`;

      if (newGroups[groupKey]) {
        newGroups[groupKey].photos.push(...remainingPhotos);
      } else {
        newGroups[groupKey] = {
          photos: remainingPhotos,
          worldId: oldestSession.worldId,
          worldName: oldestSession.worldName,
          worldInstanceId: oldestSession.worldInstanceId,
          joinDateTime: oldestSession.joinDateTime,
        };
      }
    }

    setGroupedPhotos(newGroups);
    setProcessedCount((prev) => prev + BATCH_SIZE);
    processingRef.current = false;
  }, [joinLogs, processedCount, sortedPhotos, groupedPhotos]);

  // バッチ処理の実行
  useEffect(() => {
    if (processedCount < photos.length && !processingRef.current) {
      processBatch();
    }
  }, [processedCount, photos.length, processBatch]);

  return groupedPhotos;
}
