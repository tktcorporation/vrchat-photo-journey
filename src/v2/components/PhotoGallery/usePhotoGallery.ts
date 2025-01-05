import { trpcReact } from '@/trpc';
import { useMemo, useState } from 'react';
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
  const { data: photoList, isLoading: isLoadingPhotos } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery(undefined, {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 3,
      retryDelay: 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    });

  const photos = useMemo(() => {
    if (!photoList) return [];
    return photoList.map((photo) => ({
      id: photo.id,
      url: photo.photoPath,
      fileName: photo.photoPath.split('/').pop() || '',
      width: photo.width || 1920,
      height: photo.height || 1080,
      takenAt: photo.photoTakenAt,
      location: {
        name: '',
        description: '',
        joinedAt: photo.photoTakenAt,
      },
    }));
  }, [photoList]);

  const {
    groupedPhotos: originalGroupedPhotos,
    isLoading: isGrouping,
    loadMoreGroups,
    debug,
  } = useGroupPhotos(photos);

  const groupedPhotos = useMemo(() => {
    if (!searchQuery) return originalGroupedPhotos;

    const query = searchQuery.toLowerCase();
    const filteredGroups: GroupedPhotos = {};

    for (const [key, group] of Object.entries(originalGroupedPhotos)) {
      // ワールド名での検索
      if (group.worldInfo?.worldName.toLowerCase().includes(query)) {
        filteredGroups[key] = group;
      }
    }

    return filteredGroups;
  }, [originalGroupedPhotos, searchQuery]);

  const isLoading = useMemo(() => {
    if (isLoadingPhotos) return true;
    if (isGrouping) return true;
    if (!photoList) return true;
    return false;
  }, [isLoadingPhotos, isGrouping, photoList]);

  return {
    groupedPhotos,
    isLoading,
    selectedPhoto,
    setSelectedPhoto,
    loadMoreGroups,
    debug,
  };
}
