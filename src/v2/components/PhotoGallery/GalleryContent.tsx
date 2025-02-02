import { useVirtualizer } from '@tanstack/react-virtual';
import { LoaderCircle } from 'lucide-react';
import { memo, useCallback, useMemo, useRef } from 'react';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import PhotoModal from '../PhotoModal';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import { MeasurePhotoGroup } from './MeasurePhotoGroup';
import { usePhotoGallery } from './usePhotoGallery';

interface GalleryContentProps {
  searchQuery: string;
  showEmptyGroups: boolean;
  isLoadingStartupSync: boolean;
}

const GROUP_SPACING = 100;
const CONTAINER_PADDING = 16;

const GalleryContent = memo(
  ({
    searchQuery,
    showEmptyGroups,
    isLoadingStartupSync,
  }: GalleryContentProps) => {
    const {
      groupedPhotos,
      isLoading: isLoadingGrouping,
      selectedPhoto,
      setSelectedPhoto,
    } = usePhotoGallery(searchQuery);
    const containerRef = useRef<HTMLDivElement>(null);
    const groupSizesRef = useRef<Map<string, number>>(new Map());
    const filteredGroups = useMemo(() => {
      return Object.entries(groupedPhotos).filter(
        ([_, group]) => showEmptyGroups || group.photos.length > 0,
      );
    }, [groupedPhotos, showEmptyGroups]);

    const isLoading = isLoadingGrouping || isLoadingStartupSync;

    const virtualizer = useVirtualizer({
      count: filteredGroups.length,
      getScrollElement: () => containerRef.current,
      estimateSize: useCallback(
        (index) => {
          const [key] = filteredGroups[index];
          return (groupSizesRef.current.get(key) ?? 400) + GROUP_SPACING;
        },
        [filteredGroups],
      ),
      overscan: 5,
      measureElement: useCallback((element: HTMLElement) => {
        const height = element.getBoundingClientRect().height;
        const key = element.getAttribute('data-key');
        if (key) {
          groupSizesRef.current.set(key, height);
        }
        return height + GROUP_SPACING;
      }, []),
    });

    return (
      <GalleryErrorBoundary>
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const [key, group] = filteredGroups[virtualRow.index];
              return (
                <div
                  key={key}
                  data-key={key}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: `${GROUP_SPACING - CONTAINER_PADDING}px`,
                  }}
                >
                  <div className="space-y-2">
                    <LocationGroupHeader
                      worldId={group.worldInfo?.worldId ?? null}
                      worldName={group.worldInfo?.worldName ?? null}
                      worldInstanceId={group.worldInfo?.worldInstanceId ?? null}
                      photoCount={group.photos.length}
                      joinDateTime={group.joinDateTime}
                    />
                    {group.photos.length > 0 ? (
                      <PhotoGrid
                        worldId={group.worldInfo?.worldId ?? null}
                        photos={group.photos}
                        onPhotoSelect={setSelectedPhoto}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        写真がありません
                      </div>
                    )}
                  </div>
                  <MeasurePhotoGroup
                    photos={group.photos}
                    onMeasure={(height) => {
                      groupSizesRef.current.set(key, height);
                      virtualizer.measure();
                    }}
                  />
                </div>
              );
            })}
          </div>
          {isLoading && (
            <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <LoaderCircle className="w-4 h-4 animate-spin text-gray-500" />
              <div className="text-sm text-gray-500">読み込み中...</div>
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
