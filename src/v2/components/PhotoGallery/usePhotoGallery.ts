import { useState, useMemo } from 'react';
import { generatePhotos } from '../../data/photos';
import { Photo } from '../../types/photo';
import { useGroupPhotos } from './useGroupPhotos';

export function usePhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const allPhotos = useMemo(() => generatePhotos(), []);

  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return allPhotos;
    
    const query = searchQuery.toLowerCase();
    return allPhotos.filter(photo => 
      photo.title.toLowerCase().includes(query) ||
      photo.tags.some(tag => tag.toLowerCase().includes(query)) ||
      photo.location.name.toLowerCase().includes(query) ||
      photo.location.prefecture.toLowerCase().includes(query)
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
  };
}