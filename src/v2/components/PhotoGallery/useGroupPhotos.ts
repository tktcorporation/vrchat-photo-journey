import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  loadedPhotos: number;
  totalGroups: number;
  loadedGroups: number;
  remainingPhotos: number;
  remainingGroups: number;
}

// 写真をワールドセッションごとにグループ化する純粋な関数
export function groupPhotosBySession(
  photos: Photo[],
  joinLogs: WorldJoinLog[],
): GroupedPhoto[] {
  // 写真を新しい順にソート
  const sortedPhotos = [...photos].sort(
    (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
  );

  // joinLogsを新しい順にソート
  const sortedLogs = [...joinLogs].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  // 各セッションに対してグループを作成
  const groups: GroupedPhoto[] = [];
  let remainingPhotos = [...sortedPhotos];

  console.log('Initial state:', {
    totalPhotos: photos.length,
    totalSessions: joinLogs.length,
    firstSessionTime: sortedLogs[0]?.joinDateTime,
    firstPhotoTime: sortedPhotos[0]?.takenAt,
  });

  // 各セッションに対してグループを作成
  for (let i = 0; i < sortedLogs.length; i++) {
    const currentSession = sortedLogs[i];
    const nextSession = sortedLogs[i + 1];

    // このセッションに属する写真を見つける
    const sessionPhotos = remainingPhotos.filter((photo) => {
      const photoTime = photo.takenAt.getTime();
      const sessionStartTime = currentSession.joinDateTime.getTime();
      const nextSessionTime = nextSession?.joinDateTime.getTime();

      // 写真の時間がこのセッションの開始時間以前で、
      // 次のセッションの開始時間より後（または次のセッションがない）場合に
      // このセッションに属すると判定
      return (
        photoTime <= sessionStartTime &&
        (!nextSessionTime || photoTime > nextSessionTime)
      );
    });

    console.log('Processing session:', {
      index: i,
      worldName: currentSession.worldName,
      sessionStartTime: currentSession.joinDateTime,
      sessionTimeStamp: currentSession.joinDateTime.getTime(),
      nextSessionTime: nextSession?.joinDateTime,
      nextSessionTimeStamp: nextSession?.joinDateTime.getTime(),
      foundPhotos: sessionPhotos.length,
      remainingPhotos: remainingPhotos.length,
      photoTimeRange:
        sessionPhotos.length > 0
          ? {
              first: sessionPhotos[0].takenAt,
              last: sessionPhotos[sessionPhotos.length - 1].takenAt,
            }
          : null,
    });

    // セッションが空でも必ずグループを作成
    groups.push({
      photos: sessionPhotos,
      worldInfo: {
        worldId: currentSession.worldId,
        worldName: currentSession.worldName,
        worldInstanceId: currentSession.worldInstanceId,
      },
      joinDateTime: currentSession.joinDateTime,
    });

    // 処理済みの写真を除外
    remainingPhotos = remainingPhotos.filter(
      (photo) => !sessionPhotos.includes(photo),
    );
  }

  // 残りの写真を最も近いセッションに割り当て
  if (remainingPhotos.length > 0) {
    console.log('Processing unmatched photos:', {
      count: remainingPhotos.length,
      firstPhotoTime: remainingPhotos[0].takenAt,
      lastPhotoTime: remainingPhotos[remainingPhotos.length - 1].takenAt,
      timeRange: {
        first: remainingPhotos[0].takenAt.getTime(),
        last: remainingPhotos[remainingPhotos.length - 1].takenAt.getTime(),
      },
    });

    // 各写真に対して最も近いセッションを見つける
    for (const photo of remainingPhotos) {
      let closestSession = sortedLogs[0];
      let minTimeDiff = Math.abs(
        photo.takenAt.getTime() - sortedLogs[0].joinDateTime.getTime(),
      );

      // 最も時間差が小さいセッションを探す
      for (const session of sortedLogs) {
        const timeDiff = Math.abs(
          photo.takenAt.getTime() - session.joinDateTime.getTime(),
        );
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestSession = session;
        }
      }

      // 最も近いセッションのグループを見つけて写真を追加
      const groupIndex = groups.findIndex(
        (group) =>
          group.worldInfo?.worldInstanceId === closestSession.worldInstanceId &&
          group.joinDateTime.getTime() ===
            closestSession.joinDateTime.getTime(),
      );
      if (groupIndex !== -1) {
        groups[groupIndex].photos.push(photo);
        // 写真を時間順にソート
        groups[groupIndex].photos.sort(
          (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
        );
      }
    }
  }

  console.log(
    'Final groups:',
    groups.map((group) => ({
      worldName: group.worldInfo?.worldName,
      photoCount: group.photos.length,
      joinDateTime: group.joinDateTime,
      firstPhotoTime: group.photos[0]?.takenAt,
      lastPhotoTime: group.photos[group.photos.length - 1]?.takenAt,
    })),
  );

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
  loadMoreGroups: () => void;
  debug: DebugInfo;
} {
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos>({});
  const [processedGroupCount, setProcessedGroupCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const processingRef = useRef(false);
  const photosRef = useRef(photos);
  const allGroupsRef = useRef<GroupedPhoto[] | null>(null);
  const processingQueueRef = useRef<(() => Promise<void>)[]>([]);
  const [debugInfo, setDebugInfo] = useState({
    totalPhotos: 0,
    loadedPhotos: 0,
    totalGroups: 0,
    loadedGroups: 0,
    remainingPhotos: 0,
    remainingGroups: 0,
  });
  const GROUPS_PER_CHUNK = 5;

  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
    );
  }, [photos]);

  const { data: joinLogs } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      {
        orderByJoinDateTime: 'desc',
      },
      {
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60,
      },
    );

  // キューの処理を行う関数
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;

    while (processingQueueRef.current.length > 0) {
      processingRef.current = true;
      const nextProcess = processingQueueRef.current.shift();
      if (nextProcess) {
        try {
          await nextProcess();
        } catch (error) {
          console.error('Error processing queue:', error);
        }
      }
      processingRef.current = false;
    }
  }, []);

  const processNextChunk = useCallback(
    (fixedProcessedGroupCount: number) => {
      if (!joinLogs) {
        console.log('No join logs available');
        return Promise.resolve(false);
      }

      return new Promise<boolean>((resolve) => {
        console.log('Processing next chunk, current state:', {
          fixedProcessedGroupCount,
          isComplete,
          isLoading,
        });

        try {
          // 初回のみグループを作成
          if (!allGroupsRef.current) {
            const firstGroup = groupPhotosBySession(sortedPhotos, joinLogs);
            console.log('Creating all groups for the first time: ', firstGroup);
            allGroupsRef.current = firstGroup;
          }

          // まだ処理していないグループを取得
          const remainingGroups = allGroupsRef.current.slice(
            fixedProcessedGroupCount,
          );
          if (remainingGroups.length === 0) {
            console.log('No remaining groups');
            setIsComplete(true);
            resolve(false);
            return;
          }

          // 次のチャンクのグループを処理
          const groupsToProcess = remainingGroups.slice(0, GROUPS_PER_CHUNK);
          const newGroups = convertGroupsToRecord(groupsToProcess);

          setGroupedPhotos((prev) => ({
            ...prev,
            ...newGroups,
          }));

          // 処理済みのグループ数を更新
          const nextProcessedCount =
            fixedProcessedGroupCount + groupsToProcess.length;
          setProcessedGroupCount(nextProcessedCount);

          // デバッグ情報を更新
          const allLoadedPhotos =
            Object.values(groupedPhotos).reduce(
              (sum, group) => sum + group.photos.length,
              0,
            ) +
            groupsToProcess.reduce(
              (sum, group) => sum + group.photos.length,
              0,
            );

          const debugData = {
            totalPhotos: photos.length,
            loadedPhotos: allLoadedPhotos,
            totalGroups: allGroupsRef.current.length,
            loadedGroups: nextProcessedCount,
            remainingPhotos: photos.length - allLoadedPhotos,
            remainingGroups: allGroupsRef.current.length - nextProcessedCount,
          };

          setDebugInfo(debugData);
          resolve(nextProcessedCount < allGroupsRef.current.length);
        } catch (error) {
          console.error('Error in processNextChunk:', error);
          resolve(false);
        }
      });
    },
    [
      joinLogs,
      sortedPhotos,
      photos.length,
      groupedPhotos,
      isComplete,
      isLoading,
    ],
  );

  const loadMoreGroups = useCallback(() => {
    if (isComplete) {
      console.log('Load more blocked: processing complete');
      return;
    }

    if (!joinLogs) {
      console.log('No join logs available');
      return;
    }

    console.log('Queueing next chunk processing');
    const processPromise = async () => {
      setIsLoading(true);
      try {
        await processNextChunk(processedGroupCount);
      } finally {
        setIsLoading(false);
      }
    };

    processingQueueRef.current.push(processPromise);
    processQueue();
  }, [processNextChunk, joinLogs, isComplete, processQueue]);

  // 写真データが変更された場合のリセット
  useEffect(() => {
    if (!photos.length) return;
    if (photos === photosRef.current) return;

    console.log('Photos changed, resetting state');
    photosRef.current = photos;
    allGroupsRef.current = null;
    setGroupedPhotos({});
    setProcessedGroupCount(0);
    setIsComplete(false);
    processingRef.current = false;
    processingQueueRef.current = [];
    setIsLoading(true);

    const initializePromise = async () => {
      try {
        await processNextChunk(0);
      } finally {
        setIsLoading(false);
      }
    };

    processingQueueRef.current.push(initializePromise);
    processQueue();
  }, [photos, processNextChunk, processQueue]);

  // 初期データの読み込み
  useEffect(() => {
    if (!photos.length || !joinLogs) return;
    if (processedGroupCount > 0) return;

    console.log('Loading initial data');
    const initialLoadPromise = async () => {
      setIsLoading(true);
      try {
        await processNextChunk(0);
      } finally {
        setIsLoading(false);
      }
    };

    processingQueueRef.current.push(initialLoadPromise);
    processQueue();
  }, [photos, joinLogs, processedGroupCount, processNextChunk, processQueue]);

  return {
    groupedPhotos,
    isLoading,
    loadMoreGroups,
    debug: debugInfo,
  };
}
