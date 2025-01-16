import { trpcReact } from '@/trpc';
import pathe from 'pathe';
import { useMemo, useState } from 'react';
import type { Photo } from '../../types/photo';
import { VRChatPhotoFileNameWithExtSchema } from './../../../../shared/valueObjects';
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
  debug: DebugInfo;
} {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const { data: photoList, isLoading: isLoadingPhotos } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery(
      {
        orderByPhotoTakenAt: 'desc',
      },
      {
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30,
        retry: 3,
        retryDelay: 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    );

  const photos = useMemo(() => {
    if (!photoList) return [];

    return photoList
      .map((photo) => {
        try {
          const parsedFileName = VRChatPhotoFileNameWithExtSchema.parse(
            pathe.parse(photo.photoPath).base,
          );
          return {
            id: photo.id,
            url: photo.photoPath,
            fileNameWithExt: parsedFileName,
            width: photo.width || 1920,
            height: photo.height || 1080,
            takenAt: photo.photoTakenAt,
            location: {
              joinedAt: photo.photoTakenAt,
            },
          };
        } catch (error) {
          console.warn(`Invalid photo file name: ${photo.photoPath}`, error);
          return null;
        }
      })
      .filter((photo): photo is NonNullable<typeof photo> => photo !== null);
  }, [photoList]);

  const { groupedPhotos: originalGroupedPhotos, debug } =
    useGroupPhotos(photos);

  const isLoading = useMemo(() => {
    if (isLoadingPhotos) return true;
    if (!photoList) return true;
    return false;
  }, [isLoadingPhotos, photoList]);

  const groupedPhotos = useMemo(() => {
    if (!searchQuery) return originalGroupedPhotos;

    const query = searchQuery.toLowerCase();
    const filteredGroups: GroupedPhotos = {};

    for (const [key, group] of Object.entries(originalGroupedPhotos)) {
      if (
        group.worldInfo?.worldName.toLowerCase().includes(query) ||
        group.photos.some((photo) =>
          photo.fileNameWithExt.value.toLowerCase().includes(query),
        )
      ) {
        filteredGroups[key] = group;
      }
    }

    return filteredGroups;
  }, [originalGroupedPhotos, searchQuery]);

  return {
    groupedPhotos,
    isLoading,
    selectedPhoto,
    setSelectedPhoto,
    debug,
  };
}
