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
    isLoading,
  } = usePhotoGallery();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettings={() => setShowSettings(true)}
          groupCount={0}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            写真を読み込み中...
          </div>
        </div>
      </div>
    );
  }

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
