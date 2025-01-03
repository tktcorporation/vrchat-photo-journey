import { memo } from 'react';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import PhotoModal from '../PhotoModal';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import { usePhotoGallery } from './usePhotoGallery';

interface GalleryContentProps {
  searchQuery: string;
  showEmptyGroups: boolean;
}

const GalleryContent = memo(
  ({ searchQuery, showEmptyGroups }: GalleryContentProps) => {
    const { groupedPhotos, isLoading, selectedPhoto, setSelectedPhoto } =
      usePhotoGallery(searchQuery);

    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">写真を読み込み中...</div>
        </div>
      );
    }

    return (
      <GalleryErrorBoundary>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.entries(groupedPhotos)
            .filter(([_, group]) => showEmptyGroups || group.photos.length > 0)
            .map(([key, group]) => (
              <div key={key} className="space-y-4">
                <LocationGroupHeader
                  worldId={group.worldInfo?.worldId ?? null}
                  worldName={group.worldInfo?.worldName ?? null}
                  worldInstanceId={group.worldInfo?.worldInstanceId ?? null}
                  photoCount={group.photos.length}
                  joinDateTime={group.joinDateTime}
                />
                {group.photos.length > 0 && (
                  <PhotoGrid
                    photos={group.photos}
                    onPhotoSelect={setSelectedPhoto}
                  />
                )}
              </div>
            ))}
        </div>
        {selectedPhoto && (
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </GalleryErrorBoundary>
    );
  },
);

GalleryContent.displayName = 'GalleryContent';

export default GalleryContent;
