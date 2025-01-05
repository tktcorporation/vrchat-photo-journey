import { memo, useCallback, useEffect, useRef } from 'react';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import PhotoModal from '../PhotoModal';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import type { DebugInfo } from './useGroupPhotos';
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
      debug,
    } = usePhotoGallery(searchQuery);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(debug.remainingGroups > 0);
    const scrollTimeoutRef = useRef<number | null>(null);

    const checkAndLoadMore = useCallback(() => {
      if (!containerRef.current || loadingRef.current || isLoading) {
        console.log('Check blocked:', {
          noContainer: !containerRef.current,
          isLoading: loadingRef.current,
          globalLoading: isLoading,
        });
        return;
      }
      if (!hasMoreRef.current) {
        console.log('No more content to load');
        return;
      }

      const container = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 200;
      const remaining = scrollHeight - (scrollTop + clientHeight);

      console.log('Checking scroll position:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        threshold,
        remaining,
        debug,
      });

      if (remaining < threshold) {
        console.log('Triggering load more');
        loadingRef.current = true;
        loadMoreGroups();
        setTimeout(() => {
          loadingRef.current = false;
        }, 500);
      }
    }, [isLoading, loadMoreGroups, debug]);

    const handleScroll = useCallback(() => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        checkAndLoadMore();
        scrollTimeoutRef.current = null;
      }, 50);
    }, [checkAndLoadMore]);

    useEffect(() => {
      hasMoreRef.current = debug.remainingGroups > 0;
      console.log('Updated hasMore:', {
        remainingGroups: debug.remainingGroups,
        hasMore: hasMoreRef.current,
      });
    }, [debug.remainingGroups]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll);

      const initialCheckTimeout = setTimeout(() => {
        if (
          container.scrollHeight <= container.clientHeight &&
          hasMoreRef.current
        ) {
          console.log('Initial load - content fits without scroll');
          loadMoreGroups();
        } else if (
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 200
        ) {
          console.log('Initial load - scrolled to bottom');
          loadMoreGroups();
        }
      }, 100);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current !== null) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        clearTimeout(initialCheckTimeout);
      };
    }, [handleScroll, loadMoreGroups]);

    useEffect(() => {
      const initialTimeout = setTimeout(() => {
        checkAndLoadMore();
      }, 200);

      return () => clearTimeout(initialTimeout);
    }, [checkAndLoadMore]);

    const filteredGroups = Object.entries(groupedPhotos).filter(
      ([_, group]) => showEmptyGroups || group.photos.length > 0,
    );

    return (
      <GalleryErrorBoundary>
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-10"
        >
          {/* <div className="bg-gray-100 p-4 rounded-lg text-sm">
            <h3 className="font-bold mb-2">デバッグ情報</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>総写真数: {debug.totalPhotos}</div>
              <div>読み込み済み: {debug.loadedPhotos}</div>
              <div>総グループ数: {debug.totalGroups}</div>
              <div>読み込み済みグループ: {debug.loadedGroups}</div>
              <div>残り写真数: {debug.remainingPhotos}</div>
              <div>残りグループ数: {debug.remainingGroups}</div>
              <div>読み込み中: {isLoading ? 'はい' : 'いいえ'}</div>
              <div>追加読み込み可能: {hasMoreRef.current ? 'はい' : 'いいえ'}</div>
            </div>
          </div> */}

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
