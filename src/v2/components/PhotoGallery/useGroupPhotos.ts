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

  // セッションを新しい順にソート
  const sortedSessions = [...joinLogs].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  const groups: GroupedPhoto[] = [];
  let remainingPhotos = [...sortedPhotos];

  // 各セッションに対してグループを作成
  for (let i = 0; i < sortedSessions.length; i++) {
    const currentSession = sortedSessions[i];
    const nextSession = sortedSessions[i + 1];

    // このセッションに属する写真を見つける
    const sessionPhotos = remainingPhotos.filter((photo) => {
      const photoTime = photo.takenAt.getTime();
      const sessionStartTime = currentSession.joinDateTime.getTime();
      const sessionEndTime = nextSession?.joinDateTime.getTime() ?? 0;

      // 最新のセッションの場合
      if (i === 0) {
        return photoTime >= sessionStartTime;
      }
      // それ以外のセッションの場合
      return photoTime >= sessionEndTime && photoTime < sessionStartTime;
    });

    if (sessionPhotos.length > 0) {
      console.log('Session photos:', {
        sessionIndex: i,
        worldName: currentSession.worldName,
        photoCount: sessionPhotos.length,
        firstPhotoTime: sessionPhotos[0].takenAt,
        lastPhotoTime: sessionPhotos[sessionPhotos.length - 1].takenAt,
        sessionStartTime: currentSession.joinDateTime,
        sessionEndTime: nextSession?.joinDateTime,
      });

      // グループを作成
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
  }

  // 残りの写真を処理（セッションに属さない写真）
  if (remainingPhotos.length > 0) {
    console.log('Processing unmatched photos:', {
      count: remainingPhotos.length,
      firstPhotoTime: remainingPhotos[0].takenAt,
      lastPhotoTime: remainingPhotos[remainingPhotos.length - 1].takenAt,
    });

    // 日付でグループ化
    const photosByDate = remainingPhotos.reduce(
      (acc, photo) => {
        const date = photo.takenAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(photo);
        return acc;
      },
      {} as Record<string, Photo[]>,
    );

    // 日付ごとにグループを作成
    for (const [_date, datePhotos] of Object.entries(photosByDate)) {
      groups.push({
        photos: datePhotos,
        worldInfo: null,
        joinDateTime: datePhotos[0].takenAt,
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
  debug: DebugInfo;
} {
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos>({});
  const [processedGroupCount, setProcessedGroupCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const processingRef = useRef(false);
  const photosRef = useRef(photos);
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

  const processNextChunk = useCallback(() => {
    if (!joinLogs || processingRef.current) {
      console.log('Process blocked:', {
        noJoinLogs: !joinLogs,
        isProcessing: processingRef.current,
      });
      return false;
    }

    processingRef.current = true;
    console.log('Processing next chunk, current state:', {
      processedGroupCount,
      isComplete,
      isLoading,
    });

    try {
      // 全てのグループを作成
      const allGroups = groupPhotosBySession(sortedPhotos, joinLogs);

      // まだ処理していないグループを取得
      const remainingGroups = allGroups.slice(processedGroupCount);
      if (remainingGroups.length === 0) {
        console.log('No remaining groups');
        setIsComplete(true);
        return false;
      }

      // 次のチャンクのグループを処理
      const groupsToProcess = remainingGroups.slice(0, GROUPS_PER_CHUNK);

      // グループ内の写真数をログ
      groupsToProcess.forEach((group, index) => {
        console.log(`Group ${processedGroupCount + index} photos:`, {
          worldName: group.worldInfo?.worldName,
          photoCount: group.photos.length,
          firstPhotoTime: group.photos[0]?.takenAt,
          lastPhotoTime: group.photos[group.photos.length - 1]?.takenAt,
        });
      });

      const newGroups = convertGroupsToRecord(groupsToProcess);

      // 新しいグループの写真数を確認
      for (const [key, group] of Object.entries(newGroups)) {
        console.log(`New group ${key} photos:`, {
          worldName: group.worldInfo?.worldName,
          photoCount: group.photos.length,
        });
      }

      console.log('Processing chunk:', {
        processedCount: processedGroupCount,
        newGroupsCount: groupsToProcess.length,
        remainingCount: remainingGroups.length,
        totalGroups: allGroups.length,
        totalPhotosInChunk: groupsToProcess.reduce(
          (sum, group) => sum + group.photos.length,
          0,
        ),
      });

      // 既存のグループと新しいグループを結合
      setGroupedPhotos((prev) => {
        const updated = { ...prev };
        for (const [key, group] of Object.entries(newGroups)) {
          if (prev[key]) {
            // 既存のグループがある場合は写真を結合
            updated[key] = {
              ...group,
              photos: [...prev[key].photos, ...group.photos],
            };
          } else {
            updated[key] = group;
          }
        }
        return updated;
      });

      // 現在のグループ数を更新
      const nextProcessedCount = processedGroupCount + groupsToProcess.length;
      setProcessedGroupCount(nextProcessedCount);

      // デバッグ情報を更新
      const allLoadedPhotos =
        Object.values(groupedPhotos).reduce(
          (sum, group) => sum + group.photos.length,
          0,
        ) +
        groupsToProcess.reduce((sum, group) => sum + group.photos.length, 0);

      const debugData = {
        totalPhotos: photos.length,
        loadedPhotos: allLoadedPhotos,
        totalGroups: allGroups.length,
        loadedGroups: nextProcessedCount,
        remainingPhotos: photos.length - allLoadedPhotos,
        remainingGroups: allGroups.length - nextProcessedCount,
      };

      console.log('Updating debug info:', debugData);
      setDebugInfo(debugData);

      // 残りのグループがあるかどうかを確認
      const hasMore = nextProcessedCount < allGroups.length;
      if (!hasMore) {
        console.log('No more groups to load');
        setIsComplete(true);
      }
      return hasMore;
    } finally {
      processingRef.current = false;
    }
  }, [
    joinLogs,
    sortedPhotos,
    processedGroupCount,
    photos.length,
    groupedPhotos,
  ]);

  const loadMoreGroups = useCallback(() => {
    if (processingRef.current || isComplete) {
      console.log('Load more blocked:', {
        isProcessing: processingRef.current,
        isComplete,
      });
      return;
    }

    if (!joinLogs) {
      console.log('No join logs available');
      return;
    }

    console.log('Starting to load more groups');
    setIsLoading(true);

    try {
      const hasMore = processNextChunk();
      console.log('Finished loading chunk:', { hasMore });
    } finally {
      setIsLoading(false);
    }
  }, [processNextChunk, joinLogs, isComplete]);

  // 写真データが変更された場合のリセット
  useEffect(() => {
    if (!photos.length) return;
    if (photos === photosRef.current) return;

    console.log('Photos changed, resetting state');
    photosRef.current = photos;
    setGroupedPhotos({});
    setProcessedGroupCount(0);
    setIsComplete(false);
    processingRef.current = false;
    setIsLoading(true);

    try {
      processNextChunk();
    } finally {
      setIsLoading(false);
    }
  }, [photos, processNextChunk]);

  // 初期データの読み込み
  useEffect(() => {
    if (!photos.length || !joinLogs) return;
    if (processedGroupCount > 0) return;

    console.log('Loading initial data');
    setIsLoading(true);
    try {
      processNextChunk();
    } finally {
      setIsLoading(false);
    }
  }, [photos, joinLogs, processedGroupCount, processNextChunk]);

  return {
    groupedPhotos,
    isLoading,
    loadMoreGroups,
    debug: debugInfo,
  };
}
