import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import PhotoModal from '../PhotoModal';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import { MeasurePhotoGroup } from './MeasurePhotoGroup';
import { usePhotoGallery } from './usePhotoGallery';

interface GalleryContentProps {
  searchQuery: string;
  showEmptyGroups: boolean;
}

const SCROLL_THRESHOLD = 200;
const GROUP_SPACING = 160;
const CONTAINER_PADDING = 16;

const GalleryContent = memo(
  ({ searchQuery, showEmptyGroups }: GalleryContentProps) => {
    const {
      groupedPhotos,
      isLoading,
      selectedPhoto,
      setSelectedPhoto,
      loadMoreGroups,
      debug,
    } = usePhotoGallery(searchQuery);
    console.log('groupedPhotos', groupedPhotos);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(debug.remainingGroups > 0);
    const groupSizesRef = useRef<Map<string, number>>(new Map());

    const filteredGroups = useMemo(() => {
      const groups = Object.entries(groupedPhotos).filter(
        ([_, group]) => showEmptyGroups || group.photos.length > 0,
      );
      console.log('Filtered groups:', {
        totalGroups: groups.length,
        firstGroupKey: groups[0]?.[0],
        firstGroupPhotos: groups[0]?.[1].photos.length,
        showEmptyGroups,
      });
      return groups;
    }, [groupedPhotos, showEmptyGroups]);

    const virtualizer = useVirtualizer({
      count: filteredGroups.length,
      getScrollElement: () => containerRef.current,
      estimateSize: useCallback(
        (index) => {
          const [key] = filteredGroups[index];
          const size = (groupSizesRef.current.get(key) ?? 400) + GROUP_SPACING;
          if (index === 0) {
            console.log('First group size:', {
              key,
              estimatedSize: size,
              actualSize: groupSizesRef.current.get(key),
              photos: filteredGroups[0][1].photos.length,
            });
          }
          return size;
        },
        [filteredGroups],
      ),
      overscan: 5,
      measureElement: useCallback((element: HTMLElement) => {
        const height = element.getBoundingClientRect().height;
        const key = element.getAttribute('data-key');
        if (key) {
          groupSizesRef.current.set(key, height);
          console.log('Measured group:', {
            key,
            height,
            previousHeight: groupSizesRef.current.get(key),
          });
        }
        return height + GROUP_SPACING;
      }, []),
    });

    const checkAndLoadMore = useCallback(() => {
      if (
        !containerRef.current ||
        loadingRef.current ||
        isLoading ||
        !hasMoreRef.current
      ) {
        return;
      }

      const container = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const remaining = scrollHeight - (scrollTop + clientHeight);

      if (remaining < SCROLL_THRESHOLD) {
        loadingRef.current = true;
        loadMoreGroups();
        setTimeout(() => {
          loadingRef.current = false;
        }, 500);
      }
    }, [isLoading, loadMoreGroups]);

    useEffect(() => {
      hasMoreRef.current = debug.remainingGroups > 0;
    }, [debug.remainingGroups]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              checkAndLoadMore();
            }
          }
        },
        { rootMargin: '200px' },
      );

      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      container.appendChild(sentinel);
      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        sentinel.remove();
      };
    }, [checkAndLoadMore]);

    return (
      <GalleryErrorBoundary>
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
          {(() => {
            console.log(
              'Virtual items:',
              virtualizer.getVirtualItems().map((item) => ({
                index: item.index,
                start: item.start,
                size: item.size,
                key: filteredGroups[item.index][0],
                photoCount: filteredGroups[item.index][1].photos.length,
                worldName: filteredGroups[item.index][1].worldInfo?.worldName,
              })),
            );
            return null;
          })()}
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
                  <div className="space-y-6">
                    <LocationGroupHeader
                      worldId={group.worldInfo?.worldId ?? null}
                      worldName={group.worldInfo?.worldName ?? null}
                      worldInstanceId={group.worldInfo?.worldInstanceId ?? null}
                      photoCount={group.photos.length}
                      joinDateTime={group.joinDateTime}
                    />
                    {group.photos.length > 0 ? (
                      <PhotoGrid
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
