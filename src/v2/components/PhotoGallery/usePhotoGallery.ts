import { trpcReact } from '@/trpc';
import { atom, useAtom } from 'jotai';
import pathe from 'pathe';
import { useMemo } from 'react';
import { VRChatPhotoFileNameWithExtSchema } from '../../../valueObjects';
import type { Photo } from '../../types/photo';
import type { GroupedPhotos } from './useGroupPhotos';
import {
  type DebugInfo as GroupingDebugInfo,
  useGroupPhotos,
} from './useGroupPhotos';

/**
 * ギャラリーのデバッグ情報
 */
interface GalleryDebugInfo {
  /** 元の写真リストの総数 */
  totalPhotosFromSource: number;
  /** 検索クエリでフィルタリングされた後の写真の総数 */
  filteredPhotosCount: number;
  /** 現在表示されているグループの数 */
  displayedGroupsCount: number;
  /** useGroupPhotos フックから返された写真の総数 */
  totalPhotosFromHook: number;
  /** useGroupPhotos フックから返されたグループの総数 */
  totalGroupsFromHook: number;
}

/** 表示中の写真（モーダル表示用） */
const selectedPhotoAtom = atom<Photo | null>(null);
/** 選択されている写真のIDセット */
const selectedPhotosAtom = atom<Set<string>>(new Set<string>());
/** 複数選択モードかどうか */
const isMultiSelectModeAtom = atom<boolean>(false);

/**
 * usePhotoGallery フックのオプション
 */
interface UsePhotoGalleryOptions {
  /** グルーピング処理が完了したときに呼び出されるコールバック */
  onGroupingEnd?: () => void;
}

/**
 * 写真ギャラリーの状態管理とロジックを提供するカスタムフック
 * @param searchQuery - ヘッダーの検索バーに入力された検索クエリ
 * @param options - オプション
 * @returns ギャラリー表示に必要な状態とセッター関数
 */
export function usePhotoGallery(
  searchQuery: string,
  options?: UsePhotoGalleryOptions,
): {
  /** ワールドセッションごとにグループ化され、検索クエリでフィルタリングされた写真データ */
  groupedPhotos: GroupedPhotos;
  /** 写真データやグルーピング処理がロード中かどうか */
  isLoading: boolean;
  /** 現在モーダルで表示されている写真オブジェクト (単一選択) */
  selectedPhoto: Photo | null;
  /** モーダル表示する写真オブジェクトを設定する関数 */
  setSelectedPhoto: (photo: Photo | null) => void;
  /** 現在選択されている写真のIDセット */
  selectedPhotos: Set<string>;
  /** 選択されている写真のIDセットを更新する関数 */
  setSelectedPhotos: (
    update: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  /** 現在複数選択モードかどうか */
  isMultiSelectMode: boolean;
  /** 複数選択モードの有効/無効を設定する関数 */
  setIsMultiSelectMode: (value: boolean) => void;
  /** デバッグ情報 */
  debug: GalleryDebugInfo;
} {
  const [selectedPhoto, setSelectedPhoto] = useAtom(selectedPhotoAtom);
  const [selectedPhotos, setSelectedPhotos] = useAtom(selectedPhotosAtom);
  const [isMultiSelectMode, setIsMultiSelectMode] = useAtom(
    isMultiSelectModeAtom,
  );

  const { data: photoListRaw, isLoading: isLoadingPhotos } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery(
      {
        orderByPhotoTakenAt: 'desc',
      },
      {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    );

  const photoList: Photo[] = useMemo(() => {
    if (!photoListRaw) return [];
    const mappedList = photoListRaw.map((p) => {
      let fileNameWithExt: ReturnType<
        typeof VRChatPhotoFileNameWithExtSchema.parse
      >;
      try {
        const basename = pathe.basename(p.photoPath);
        fileNameWithExt = VRChatPhotoFileNameWithExtSchema.parse(basename);
      } catch (error) {
        console.warn(`Invalid photo file name: ${p.photoPath}`, error);
        return null;
      }

      return {
        id: p.id,
        url: p.photoPath,
        fileNameWithExt: fileNameWithExt,
        takenAt: p.photoTakenAt,
        width: p.width,
        height: p.height,
        location: {
          joinedAt: p.photoTakenAt,
        },
      };
    });
    return mappedList.filter(Boolean) as Photo[];
  }, [photoListRaw]);

  const {
    groupedPhotos: originalGroupedPhotos,
    isLoading: isLoadingGrouping,
    debug: groupingDebug,
  } = useGroupPhotos(photoList, options?.onGroupingEnd);

  const filteredGroupedPhotos = useMemo(() => {
    if (!searchQuery) return originalGroupedPhotos;

    const query = searchQuery.toLowerCase();
    const filtered: GroupedPhotos = {};

    for (const [key, group] of Object.entries(originalGroupedPhotos)) {
      if (group.worldInfo?.worldName.toLowerCase().includes(query)) {
        filtered[key] = group;
        continue;
      }
      const matchingPhotos = group.photos.filter((photo: Photo) =>
        photo.fileNameWithExt.value.toLowerCase().includes(query),
      );
      if (matchingPhotos.length > 0) {
        filtered[key] = group;
      }
    }
    return filtered;
  }, [originalGroupedPhotos, searchQuery]);

  const isLoading = isLoadingPhotos || isLoadingGrouping;

  const filteredPhotosCount = useMemo(() => {
    return Object.values(filteredGroupedPhotos).reduce(
      (sum, group) => sum + group.photos.length,
      0,
    );
  }, [filteredGroupedPhotos]);

  const debug = useMemo<GalleryDebugInfo>(
    () => ({
      totalPhotosFromSource: photoList?.length ?? 0,
      filteredPhotosCount,
      displayedGroupsCount: Object.keys(filteredGroupedPhotos).length,
      totalPhotosFromHook: groupingDebug.totalPhotos,
      totalGroupsFromHook: groupingDebug.totalGroups,
    }),
    [
      photoList?.length,
      filteredPhotosCount,
      filteredGroupedPhotos,
      groupingDebug.totalPhotos,
      groupingDebug.totalGroups,
    ],
  );

  return {
    groupedPhotos: filteredGroupedPhotos,
    isLoading,
    selectedPhoto,
    setSelectedPhoto,
    selectedPhotos,
    setSelectedPhotos,
    isMultiSelectMode,
    setIsMultiSelectMode,
    debug,
  };
}
