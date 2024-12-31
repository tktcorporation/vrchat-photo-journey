import { trpcReact } from '@/trpc';
import { useMemo, useState } from 'react';
import type { Photo } from '../../types/photo';
import { type GroupedPhotos, useGroupPhotos } from './useGroupPhotos';

export function usePhotoGallery(): {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPhoto: Photo | null;
  setSelectedPhoto: (photo: Photo | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  groupedPhotos: GroupedPhotos;
  isLoading: boolean;
} {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: photosData = [], isLoading } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery();

  console.log('usePhotoGallery:', {
    isLoading,
    photosDataLength: photosData?.length,
  });

  const allPhotos: Photo[] = photosData.map((photo) => ({
    id: photo.id,
    url: photo.photoPath,
    tags: [],
    takenAt: photo.photoTakenAt,
    location: {
      name: '',
      description: '',
      coverImage: '',
      visitedWith: [],
      joinedAt: new Date(photo.photoTakenAt),
    },
    width: photo.width,
    height: photo.height,
  }));

  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return allPhotos;

    const query = searchQuery.toLowerCase();
    return allPhotos.filter(
      (photo) =>
        photo.location.name.toLowerCase().includes(query) ||
        photo.location.description.toLowerCase().includes(query),
    );
  }, [allPhotos, searchQuery]);

  const groupedPhotos = useGroupPhotos(filteredPhotos);

  return {
    searchQuery,
    setSearchQuery,
    selectedPhoto,
    setSelectedPhoto,
    showSettings,
    setShowSettings,
    groupedPhotos,
    isLoading,
  };
}
