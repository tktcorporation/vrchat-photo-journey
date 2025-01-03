import { trpcReact } from '@/trpc';
import { useState } from 'react';
import type { Photo } from '../../types/photo';
import { useGroupPhotos } from './useGroupPhotos';

export function usePhotoGallery(searchQuery: string) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { data: photos, isLoading } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery();

  // 検索クエリに基づいて写真をフィルタリング
  const filteredPhotos =
    photos
      ?.map(
        (photo) =>
          ({
            id: photo.id,
            url: photo.photoPath,
            width: photo.width,
            height: photo.height,
            takenAt: photo.photoTakenAt,
            location: {
              name: '',
              description: '',
              coverImage: '',
              visitedWith: [],
              joinedAt: photo.photoTakenAt,
            },
          }) satisfies Photo,
      )
      .filter((photo) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          photo.location.name.toLowerCase().includes(query) ||
          photo.url.toLowerCase().includes(query)
        );
      }) ?? [];

  const groupedPhotos = useGroupPhotos(filteredPhotos);

  return {
    groupedPhotos,
    isLoading,
    selectedPhoto,
    setSelectedPhoto,
  };
}
