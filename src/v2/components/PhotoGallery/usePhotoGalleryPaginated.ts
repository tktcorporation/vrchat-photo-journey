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

interface GalleryDebugInfo {
  totalPhotosFromSource: number;
  filteredPhotosCount: number;
  displayedGroupsCount: number;
  totalPhotosFromHook: number;
  totalGroupsFromHook: number;
  paginationInfo?: {
    totalCount: number;
    loadedPages: number;
    hasNextPage: boolean;
  };
}

const selectedPhotoAtom = atom<Photo | null>(null);
const selectedPhotosAtom = atom<Set<string>>(new Set<string>());
const isMultiSelectModeAtom = atom<boolean>(false);

interface UsePhotoGalleryPaginatedOptions {
  onGroupingEnd?: () => void;
  pageSize?: number;
  enabled?: boolean;
}

export function usePhotoGalleryPaginated(
  searchQuery: string,
  searchType?: 'world' | 'player',
  options?: UsePhotoGalleryPaginatedOptions,
): {
  groupedPhotos: GroupedPhotos;
  isLoading: boolean;
  selectedPhoto: Photo | null;
  setSelectedPhoto: (photo: Photo | null) => void;
  selectedPhotos: Set<string>;
  setSelectedPhotos: (
    update: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (value: boolean) => void;
  debug: GalleryDebugInfo;
  loadNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const [selectedPhoto, setSelectedPhoto] = useAtom(selectedPhotoAtom);
  const [selectedPhotos, setSelectedPhotos] = useAtom(selectedPhotosAtom);
  const [isMultiSelectMode, setIsMultiSelectMode] = useAtom(
    isMultiSelectModeAtom,
  );

  const {
    data: paginatedData,
    isLoading: isLoadingPhotos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpcReact.vrchatPhoto.getVrchatPhotoPathModelListPaginated.useInfiniteQuery(
    {
      orderByPhotoTakenAt: 'desc',
      pageSize: options?.pageSize || 1000,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.currentPage < lastPage.totalPages - 1
          ? lastPage.currentPage + 1
          : undefined;
      },
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      enabled: options?.enabled !== false,
    },
  );

  const photoList: Photo[] = useMemo(() => {
    if (!paginatedData?.pages) return [];

    const allPhotos = paginatedData.pages.flatMap((page) => page.photos);
    const mappedList = allPhotos.map((p) => {
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
  }, [paginatedData]);

  const {
    groupedPhotos: originalGroupedPhotos,
    isLoading: isLoadingGrouping,
    debug: groupingDebug,
  } = useGroupPhotos(photoList, options?.onGroupingEnd);

  const isPlayerSearch = useMemo(() => {
    if (searchType === 'player') return true;
    if (searchType === 'world') return false;

    if (!searchQuery) return false;

    const query = searchQuery.toLowerCase();
    const hasWorldMatch = Object.values(originalGroupedPhotos).some((group) =>
      group.worldInfo?.worldName.toLowerCase().includes(query),
    );

    return !hasWorldMatch;
  }, [searchQuery, searchType, originalGroupedPhotos]);

  const { data: playerSearchSessions, isLoading: isLoadingPlayerSearch } =
    trpcReact.logInfo.searchSessionsByPlayerName.useQuery(
      { playerName: searchQuery },
      {
        enabled: isPlayerSearch && searchQuery.length > 0,
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30,
      },
    );

  const playerSearchSessionSet = useMemo(() => {
    if (!playerSearchSessions) return null;
    return new Set(playerSearchSessions.map((date) => date.toISOString()));
  }, [playerSearchSessions]);

  const filteredGroupedPhotos = useMemo(() => {
    if (!searchQuery) return originalGroupedPhotos;

    const query = searchQuery.toLowerCase();
    const filtered: GroupedPhotos = {};

    for (const [key, group] of Object.entries(originalGroupedPhotos)) {
      if (searchType === 'world') {
        if (group.worldInfo?.worldName.toLowerCase().includes(query)) {
          filtered[key] = group;
        }
        continue;
      }

      if (searchType === 'player') {
        if (playerSearchSessionSet) {
          const sessionKey = group.joinDateTime.toISOString();
          if (playerSearchSessionSet.has(sessionKey)) {
            filtered[key] = group;
          }
        }
        continue;
      }

      if (group.worldInfo?.worldName.toLowerCase().includes(query)) {
        filtered[key] = group;
        continue;
      }

      if (isPlayerSearch && playerSearchSessionSet) {
        const sessionKey = group.joinDateTime.toISOString();
        if (playerSearchSessionSet.has(sessionKey)) {
          filtered[key] = group;
          continue;
        }
      }

      const matchingPhotos = group.photos.filter((photo: Photo) =>
        photo.fileNameWithExt.value.toLowerCase().includes(query),
      );
      if (matchingPhotos.length > 0) {
        filtered[key] = group;
      }
    }
    return filtered;
  }, [
    originalGroupedPhotos,
    searchQuery,
    searchType,
    isPlayerSearch,
    playerSearchSessionSet,
  ]);

  const isLoading =
    isLoadingPhotos || isLoadingGrouping || isLoadingPlayerSearch;

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
      paginationInfo: paginatedData?.pages?.[0]
        ? {
            totalCount: paginatedData.pages[0].totalCount,
            loadedPages: paginatedData.pages.length,
            hasNextPage: hasNextPage || false,
          }
        : undefined,
    }),
    [
      photoList?.length,
      filteredPhotosCount,
      filteredGroupedPhotos,
      groupingDebug.totalPhotos,
      groupingDebug.totalGroups,
      paginatedData,
      hasNextPage,
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
    loadNextPage: fetchNextPage,
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
  };
}
