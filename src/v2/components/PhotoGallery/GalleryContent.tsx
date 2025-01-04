import { memo, useCallback, useEffect, useRef } from 'react';
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
    const {
      groupedPhotos,
      isLoading,
      selectedPhoto,
      setSelectedPhoto,
      loadMoreGroups,
    } = usePhotoGallery(searchQuery);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const handleScroll = useCallback(() => {
      if (!containerRef.current || loadingRef.current || isLoading) return;

      const container = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 200; // スクロール位置がボトムから200px以内になったら次を読み込む

      if (scrollHeight - (scrollTop + clientHeight) < threshold) {
        loadingRef.current = true;
        loadMoreGroups();
        setTimeout(() => {
          loadingRef.current = false;
        }, 500); // スロットリング
      }
    }, [isLoading, loadMoreGroups]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }, [handleScroll]);

    const filteredGroups = Object.entries(groupedPhotos).filter(
      ([_, group]) => showEmptyGroups || group.photos.length > 0,
    );

    return (
      <GalleryErrorBoundary>
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {filteredGroups.map(([key, group]) => (
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
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="text-gray-500">写真を読み込み中...</div>
            </div>
          )}
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
