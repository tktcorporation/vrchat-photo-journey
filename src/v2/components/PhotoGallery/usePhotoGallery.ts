import { trpcReact } from '@/trpc';
import { useMemo, useState } from 'react';
import type { Photo } from '../../types/photo';
import { useGroupPhotos } from './useGroupPhotos';

export function usePhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: photosData = [], isLoading } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery();
  const allPhotos: Photo[] = photosData.map((photo) => ({
    id: photo.id,
    url: photo.photoPath,
    title: '',
    tags: [],
    takenAt: photo.photoTakenAt,
    location: {
      prefecture: '',
      name: '',
      country: '',
      description: '',
      coverImage: '',
      visitedWith: [],
      lastVisited: new Date(photo.photoTakenAt),
    },
    width: photo.width,
    height: photo.height,
  }));

  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return allPhotos;

    const query = searchQuery.toLowerCase();
    return allPhotos.filter(
      (photo) =>
        photo.title.toLowerCase().includes(query) ||
        photo.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        photo.location.name.toLowerCase().includes(query) ||
        photo.location.prefecture.toLowerCase().includes(query),
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
