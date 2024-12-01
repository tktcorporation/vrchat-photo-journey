import type React from 'react';
import GalleryContent from './PhotoGallery/GalleryContent';
import { GalleryErrorBoundary } from './PhotoGallery/GalleryErrorBoundary';
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
    isLoading,
  } = usePhotoGallery();

  console.log('PhotoGallery render:', {
    isLoading,
    hasGroupedPhotos: !!groupedPhotos,
    groupedPhotosKeys: groupedPhotos ? Object.keys(groupedPhotos) : [],
  });

  return (
    <div className="h-full flex flex-col">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">写真を読み込み中...</div>
        </div>
      ) : (
        <GalleryErrorBoundary>
          <GalleryContent
            groupedPhotos={groupedPhotos}
            onPhotoSelect={setSelectedPhoto}
          />
        </GalleryErrorBoundary>
      )}

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
