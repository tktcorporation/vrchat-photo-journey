import type React from 'react';
import GalleryContent from './PhotoGallery/GalleryContent';
import Header from './PhotoGallery/Header';
import { usePhotoGallery } from './PhotoGallery/usePhotoGallery';
import PhotoModal from './PhotoModal';
import SettingsModal from './settings/SettingsModal';

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
    <div className="h-full flex flex-col">
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
    </div>
  );
};

export default PhotoGallery;
