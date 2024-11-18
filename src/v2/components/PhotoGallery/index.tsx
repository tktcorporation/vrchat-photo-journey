import React from 'react';
import { usePhotoGallery } from './usePhotoGallery';
import Header from './Header';
import GalleryContent from './GalleryContent';
import PhotoModal from '../PhotoModal';
import SettingsModal from '../settings/SettingsModal';

const PhotoGallery: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedPhoto,
    setSelectedPhoto,
    showSettings,
    setShowSettings,
    groupedPhotos,
  } = usePhotoGallery();

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
        groupCount={Object.keys(groupedPhotos).length}
      />

      <GalleryContent
        groupedPhotos={groupedPhotos}
        onPhotoSelect={setSelectedPhoto}
      />

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default PhotoGallery;