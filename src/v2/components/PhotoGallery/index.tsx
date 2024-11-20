import type React from 'react';
import PhotoModal from '../PhotoModal';
import SettingsModal from '../settings/SettingsModal';
import GalleryContent from './GalleryContent';
import Header from './Header';
import { usePhotoGallery } from './usePhotoGallery';

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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default PhotoGallery;
