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

interface WorldJoinLog {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
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

  // セッションを新しい順にソート
  const sortedSessions = [...joinLogs].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  const groups: GroupedPhoto[] = [];
  let remainingPhotos = [...sortedPhotos];

  // 各セッションに対してグループを作成
  for (let i = 0; i < sortedSessions.length; i++) {
    const currentSession = sortedSessions[i];
    const prevSession = sortedSessions[i - 1];

    // このセッションに属する写真を見つける
    const sessionPhotos = remainingPhotos.filter((photo) => {
      const photoTime = photo.takenAt.getTime();
      const sessionTime = currentSession.joinDateTime.getTime();
      const prevSessionTime = prevSession?.joinDateTime.getTime();

      // 最新のセッションの場合
      if (i === 0) {
        return photoTime >= sessionTime;
      }

      // それ以外のセッションの場合
      return photoTime >= sessionTime && photoTime < prevSessionTime;
    });

    // 写真の有無に関わらずグループを作成
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

  // 最後のセッションに属する写真を処理（残りの写真がある場合のみ）
  if (remainingPhotos.length > 0) {
    if (sortedSessions.length > 0) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup) {
        lastGroup.photos = [...lastGroup.photos, ...remainingPhotos];
      } else {
        const lastSession = sortedSessions[sortedSessions.length - 1];
        groups.push({
          photos: remainingPhotos,
          worldInfo: {
            worldId: lastSession.worldId,
            worldName: lastSession.worldName,
            worldInstanceId: lastSession.worldInstanceId,
          },
          joinDateTime: lastSession.joinDateTime,
        });
      }
    } else {
      // セッションが存在しない場合、グルーピング不能な写真として扱う
      groups.push({
        photos: remainingPhotos,
        worldInfo: null,
        joinDateTime: remainingPhotos[0].takenAt,
      });
    }
  }

  return groups;
}

// グループ化された写真をRecordに変換する
function convertGroupsToRecord(groups: GroupedPhoto[]): GroupedPhotos {
  return groups.reduce<GroupedPhotos>((acc, group) => {
    const key = group.worldInfo
      ? `${group.worldInfo.worldInstanceId}/${group.joinDateTime.getTime()}`
      : `ungrouped/${group.joinDateTime.getTime()}`;
    acc[key] = group;
    return acc;
  }, {});
}

export function useGroupPhotos(photos: Photo[]): {
  groupedPhotos: GroupedPhotos;
  isLoading: boolean;
  loadMoreGroups: () => void;
} {
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos>({});
  const [processedCount, setProcessedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false);
  const photosRef = useRef(photos);
  const CHUNK_SIZE = 50;

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

  const processNextChunk = useCallback(() => {
    if (!joinLogs || processingRef.current) return false;
    processingRef.current = true;

    try {
      const remainingPhotos = sortedPhotos.slice(processedCount);
      if (remainingPhotos.length === 0) {
        return false;
      }

      const photosToProcess = remainingPhotos.slice(0, CHUNK_SIZE);
      const groups = groupPhotosBySession(photosToProcess, joinLogs);
      const newGroups = convertGroupsToRecord(groups);

      setGroupedPhotos((prev) => ({
        ...prev,
        ...newGroups,
      }));
      setProcessedCount((prev) => prev + photosToProcess.length);

      return remainingPhotos.length > CHUNK_SIZE;
    } finally {
      processingRef.current = false;
    }
  }, [joinLogs, sortedPhotos, processedCount]);

  const loadMoreGroups = useCallback(() => {
    if (isLoading || !joinLogs) return;
    setIsLoading(true);

    requestAnimationFrame(() => {
      try {
        const hasMore = processNextChunk();
        if (!hasMore) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error processing photos:', error);
        setIsLoading(false);
      }
    });
  }, [isLoading, processNextChunk, joinLogs]);

  // 写真データが変更された場合のリセット
  useEffect(() => {
    if (!photos.length) return;
    if (photos === photosRef.current) return;

    photosRef.current = photos;
    setGroupedPhotos({});
    setProcessedCount(0);
    setIsLoading(true);
    processingRef.current = false;

    requestAnimationFrame(() => {
      try {
        const hasMore = processNextChunk();
        if (!hasMore) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    });
  }, [photos, processNextChunk]);

  // 初期データの読み込み
  useEffect(() => {
    if (!photos.length || !joinLogs) return;
    if (processedCount > 0) return;

    setIsLoading(true);
    requestAnimationFrame(() => {
      try {
        const hasMore = processNextChunk();
        if (!hasMore) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsLoading(false);
      }
    });
  }, [photos, joinLogs, processedCount, processNextChunk]);

  return {
    groupedPhotos,
    isLoading: isLoading || !joinLogs || processedCount === 0,
    loadMoreGroups,
  };
}
