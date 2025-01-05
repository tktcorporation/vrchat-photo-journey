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
        coverImage: '',
        visitedWith: [],
        joinedAt: photo.photoTakenAt,
      },
    }));
  }, [photoList]);

  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return photos;
    const query = searchQuery.toLowerCase();
    return photos.filter((photo) =>
      photo.fileName.toLowerCase().includes(query),
    );
  }, [photos, searchQuery]);

  const {
    groupedPhotos,
    isLoading: isGrouping,
    loadMoreGroups,
    debug,
  } = useGroupPhotos(filteredPhotos);

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
