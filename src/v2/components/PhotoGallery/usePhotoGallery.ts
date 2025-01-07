import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../types/photo';
import {
  type DebugInfo,
  type GroupedPhotos,
  useGroupPhotos,
} from './useGroupPhotos';

export function usePhotoGallery(searchQuery: string): {
  groupedPhotos: GroupedPhotos;
  isLoading: boolean;
  selectedPhoto: Photo | null;
  setSelectedPhoto: (photo: Photo | null) => void;
  loadMoreGroups: () => void;
  debug: DebugInfo;
} {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const loadingRef = useRef(false);
  const lastPhotoDateRef = useRef<Date | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const { data: photoList, isLoading: isLoadingPhotos } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery(
      {
        orderByPhotoTakenAt: 'desc',
        ...(lastPhotoDateRef.current && {
          ltPhotoTakenAt: lastPhotoDateRef.current,
        }),
      },
      {
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30,
        retry: 3,
        retryDelay: 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
      },
    );

  // 新しい写真データを処理
  useEffect(() => {
    if (!photoList || isLoadingPhotos) return;

    setPhotos((prevPhotos) => {
      const newPhotos = [...prevPhotos];
      const seenIds = new Set(newPhotos.map((p) => p.id));

      for (const photo of photoList) {
        if (!seenIds.has(photo.id)) {
          newPhotos.push({
            id: photo.id,
            url: photo.photoPath,
            fileName: photo.photoPath.split('/').pop() || '',
            width: photo.width || 1920,
            height: photo.height || 1080,
            takenAt: photo.photoTakenAt,
            location: {
              joinedAt: photo.photoTakenAt,
            },
          });
          seenIds.add(photo.id);
        }
      }

      // 最後の写真の日付を更新
      if (photoList.length > 0) {
        const lastPhoto = photoList[photoList.length - 1];
        lastPhotoDateRef.current = lastPhoto.photoTakenAt;
      }

      // 写真を日付の新しい順にソート
      return newPhotos.sort(
        (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
      );
    });
  }, [photoList, isLoadingPhotos]);

  const {
    groupedPhotos: originalGroupedPhotos,
    isLoading: isGrouping,
    loadMoreGroups,
    debug,
  } = useGroupPhotos(photos);

  const isLoading = useMemo(() => {
    if (isLoadingPhotos) return true;
    if (isGrouping) return true;
    if (!photoList) return true;
    return false;
  }, [isLoadingPhotos, isGrouping, photoList]);

  // デバッグ情報の出力
  useEffect(() => {
    console.log('Photos and groups updated:', {
      photosCount: photos.length,
      groupsCount: Object.keys(originalGroupedPhotos).length,
      isLoading,
      isLoadingPhotos,
      isGrouping,
    });
  }, [
    photos.length,
    originalGroupedPhotos,
    isLoading,
    isLoadingPhotos,
    isGrouping,
  ]);

  const groupedPhotos = useMemo(() => {
    if (!searchQuery) return originalGroupedPhotos;

    const query = searchQuery.toLowerCase();
    const filteredGroups: GroupedPhotos = {};

    for (const [key, group] of Object.entries(originalGroupedPhotos)) {
      if (
        group.worldInfo?.worldName.toLowerCase().includes(query) ||
        group.photos.some((photo) =>
          photo.fileName.toLowerCase().includes(query),
        )
      ) {
        filteredGroups[key] = group;
      }
    }

    return filteredGroups;
  }, [originalGroupedPhotos, searchQuery]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || isLoadingPhotos) return;

    loadingRef.current = true;
    loadMoreGroups();

    setTimeout(() => {
      loadingRef.current = false;
    }, 1000);
  }, [isLoadingPhotos, loadMoreGroups]);

  return {
    groupedPhotos,
    isLoading,
    selectedPhoto,
    setSelectedPhoto,
    loadMoreGroups: loadMore,
    debug: {
      ...debug,
      totalPhotos: photos.length,
      loadedPhotos: photos.length,
    },
  };
}
