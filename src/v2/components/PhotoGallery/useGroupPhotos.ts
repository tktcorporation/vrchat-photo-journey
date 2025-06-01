import { trpcReact } from '@/trpc';
import { useMemo } from 'react';
import type { Photo } from '../../types/photo';

interface WorldInfo {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
}

interface GroupedPhoto {
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

/**
 * 指定時刻以前で最も新しいログのインデックスを取得する。
 *
 * @param sortedLogs - `joinDateTime` を降順に並べたログ配列。
 * @param targetTime - 写真の撮影時刻（ミリ秒）。
 * @returns 見つかったログのインデックス、存在しなければ -1。
 */
function findClosestLogIndexBefore(
  sortedLogs: WorldJoinLog[],
  targetTime: number,
): number {
  let low = 0;
  let high = sortedLogs.length - 1;
  let bestIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = sortedLogs[mid].joinDateTime.getTime();

    if (midTime <= targetTime) {
      // targetTime 以下の時間なので、候補として保持し、さらに新しいログを探す (low側)
      bestIndex = mid;
      high = mid - 1; // 新しい順なので high を更新して前半を探索
    } else {
      // targetTime より新しい時間なので、もっと古いログを探す (high側)
      low = mid + 1; // 新しい順なので low を更新して後半を探索
    }
  }
  return bestIndex;
}

/**
 * 指定時刻に最も近いログのインデックスを取得する。
 *
 * @param sortedLogs - `joinDateTime` を降順に並べたログ配列。
 * @param targetTime - 写真の撮影時刻（ミリ秒）。
 * @returns 最も近いログのインデックス。ログが空の場合は -1。
 */
function findClosestLogIndexAbsolute(
  sortedLogs: WorldJoinLog[],
  targetTime: number,
): number {
  if (sortedLogs.length === 0) return -1;

  let low = 0;
  let high = sortedLogs.length - 1;
  let closestIndex = 0;
  let minDiff = Number.POSITIVE_INFINITY;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = sortedLogs[mid].joinDateTime.getTime();
    const diff = Math.abs(midTime - targetTime);

    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = mid;
    } else if (diff === minDiff) {
      // 同じ差の場合、元のロジックではどちらでもよかったが、
      // 安定性のためにインデックスが小さい方（= 新しい方）を優先する
      closestIndex = Math.min(closestIndex, mid);
    }

    if (midTime < targetTime) {
      // mid のログは写真より古い -> もっと新しいログを試す
      high = mid - 1; // 新しい順なので high を更新
    } else if (midTime > targetTime) {
      // mid のログは写真より新しい -> もっと古いログを試す
      low = mid + 1; // 新しい順なので low を更新
    } else {
      // 完全に一致
      return mid;
    }
  }
  return closestIndex;
}

/**
 * 写真を VRChat のワールドセッション単位でグループ化する。
 *
 * @param photos - グループ化する写真配列。
 * @param joinLogs - 降順に並べたワールド参加ログ。
 * @returns ワールド情報を含むグループ配列。
 */
export function groupPhotosBySession(
  photos: Photo[],
  joinLogs: WorldJoinLog[],
): GroupedPhoto[] {
  if (photos.length === 0) {
    return [];
  }
  if (joinLogs.length === 0) {
    // ログがない場合は、すべての写真を日時がダミーの単一グループに入れるか、
    // あるいは空を返すなど、仕様を決める必要がある。
    // 元のテストケース `セッションログがない場合、最も近いセッションに割り当てられる`
    // はログがある前提だった可能性があるため、要確認。
    // 一旦、ログがない場合はグループ化できないとして空配列を返すことにする。
    console.warn('No join logs found, unable to group photos by session.');
    return [];
  }

  // 写真を新しい順にソート
  const sortedPhotos = [...photos].sort(
    (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
  );

  // joinLogsを新しい順にソート (二分探索のためにもソートは必要)
  const sortedLogs = [...joinLogs].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  // 各セッションに対応するグループをMapで作成 (インデックス -> グループ)
  const groupMap = new Map<number, GroupedPhoto>();
  sortedLogs.forEach((session, index) => {
    groupMap.set(index, {
      photos: [],
      worldInfo: {
        worldId: session.worldId,
        worldName: session.worldName,
        worldInstanceId: session.worldInstanceId,
      },
      joinDateTime: session.joinDateTime,
    });
  });

  for (const photo of sortedPhotos) {
    const photoTime = photo.takenAt.getTime();

    // 1. 写真の時間以前で最も近いセッションログを探す
    let bestGroupIndex = findClosestLogIndexBefore(sortedLogs, photoTime);

    // 2. 見つからない場合（全てのログが写真より新しい場合）は、時間的に最も近いログを探す
    if (bestGroupIndex === -1) {
      // このケースは、写真が最も新しいログよりもさらに新しい場合に発生する
      // 元のロジックのフォールバックを再現
      bestGroupIndex = findClosestLogIndexAbsolute(sortedLogs, photoTime);
    }

    // 写真をグループに追加
    if (bestGroupIndex !== -1 && groupMap.has(bestGroupIndex)) {
      groupMap.get(bestGroupIndex)?.photos.push(photo);
    } else {
      // このケースは理論上起こらないはずだが、念のためログ出力
      console.warn(
        `Could not find appropriate group for photo: ${photo.id} taken at ${photo.takenAt}`,
      );
      // フォールバックとして最も新しいログ(index 0)に入れることもできるが、一旦入れないでおく
      // if (groupMap.size > 0) {
      //    groupMap.get(0)?.photos.push(photo);
      // }
    }
  }

  // Mapからグループの配列を取得
  const finalGroups = Array.from(groupMap.values());

  // 各グループの写真を時間順（降順）にソート
  for (const group of finalGroups) {
    group.photos.sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
  }

  return finalGroups;
}

// グループ化された写真を Record 形式に変換する
/**
 * グループ配列をキー付きのオブジェクトに変換する。
 *
 * @param groups - グループ化された写真配列。
 * @returns `worldId/日時` をキーとしたオブジェクト。
 */
function convertGroupsToRecord(groups: GroupedPhoto[]): GroupedPhotos {
  return groups.reduce<GroupedPhotos>((acc, group) => {
    const key = group.worldInfo
      ? `${group.worldInfo.worldId}/${group.joinDateTime.getTime()}`
      : `ungrouped/${group.joinDateTime.getTime()}`;
    acc[key] = group;
    return acc;
  }, {});
}

/**
 * 写真一覧をセッションごとにまとめた結果を返すフック。
 *
 * @param photos - グループ化対象の写真配列。
 * @param onGroupingEnd - グループ化処理が完了したときに呼び出されるコールバック
 * @returns グループ化結果と読み込み状態を含むオブジェクト。
 */
export function useGroupPhotos(
  photos: Photo[],
  onGroupingEnd?: () => void,
): {
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
    if (isLoadingLogs || !joinLogs) return {};
    if (joinLogs.length === 0) return {};

    const groups = groupPhotosBySession(photos, joinLogs);
    const result = convertGroupsToRecord(groups);
    onGroupingEnd?.();
    return result;
  }, [photos, joinLogs, isLoadingLogs, onGroupingEnd]);

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
