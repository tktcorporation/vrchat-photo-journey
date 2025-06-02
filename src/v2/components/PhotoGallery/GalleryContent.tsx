import { useVirtualizer } from '@tanstack/react-virtual';
import { LoaderCircle } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { UseLoadingStateResult } from '../../hooks/useLoadingState';
import { LocationGroupHeader } from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import PhotoModal from '../PhotoModal';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import { MeasurePhotoGroup } from './MeasurePhotoGroup';
import { usePhotoGallery } from './usePhotoGallery';

/**
 * ギャラリーコンテンツコンポーネントのプロパティ定義
 */
interface GalleryContentProps
  extends Pick<
    UseLoadingStateResult,
    'isLoadingStartupSync' | 'isLoadingGrouping' | 'finishLoadingGrouping'
  > {
  /** ヘッダーから渡される検索クエリ */
  searchQuery: string;
  /** 写真がないグループを表示するかどうか */
  showEmptyGroups: boolean;
}

const GROUP_SPACING = 52;

const SkeletonGroup = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, _i) => (
        <div
          key={`skeleton-photo-${crypto.randomUUID()}`}
          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"
        />
      ))}
    </div>
  </div>
);

/**
 * 写真グリッドを表示するメインコンテンツエリア
 * 仮想スクロールを使用して大量の写真を効率的にレンダリングします。
 */
const GalleryContent = memo(
  ({
    searchQuery,
    showEmptyGroups,
    isLoadingStartupSync,
    isLoadingGrouping,
    finishLoadingGrouping,
  }: GalleryContentProps) => {
    const {
      groupedPhotos,
      selectedPhoto,
      setSelectedPhoto,
      selectedPhotos,
      setSelectedPhotos,
      isMultiSelectMode,
      setIsMultiSelectMode,
    } = usePhotoGallery(searchQuery, { onGroupingEnd: finishLoadingGrouping });
    const containerRef = useRef<HTMLDivElement>(null);
    const groupSizesRef = useRef<Map<string, number>>(new Map());

    // showEmptyGroups に基づいて表示するグループをフィルタリング
    const filteredGroups = useMemo(() => {
      return Object.entries(groupedPhotos).filter(
        ([_, group]) => showEmptyGroups || group.photos.length > 0,
      );
    }, [groupedPhotos, showEmptyGroups]);

    const isLoading = isLoadingGrouping || isLoadingStartupSync;

    // Reset scroll position to top when groups change from empty to populated
    useEffect(() => {
      if (!isLoading && filteredGroups.length > 0 && containerRef.current) {
        // Scroll to top when photo data loads
        containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      }
    }, [isLoading, filteredGroups.length]);

    // 仮想スクローラーの設定
    const virtualizer = useVirtualizer({
      count: filteredGroups.length,
      getScrollElement: () => containerRef.current,
      estimateSize: useCallback(
        (index) => {
          const [key] = filteredGroups[index];
          const size = groupSizesRef.current.get(key);
          // Provide better fallback estimate for unmeasured groups
          return (size ?? 300) + GROUP_SPACING;
        },
        [filteredGroups],
      ),
      overscan: 3,
      measureElement: useCallback(
        (element: HTMLElement) => {
          const height = element.getBoundingClientRect().height;
          const index = element.getAttribute('data-index');
          if (index) {
            const indexNum = Number.parseInt(index, 10);
            if (!Number.isNaN(indexNum) && filteredGroups[indexNum]) {
              const [key] = filteredGroups[indexNum];
              groupSizesRef.current.set(key, height);

              // Note: virtualizer.measure() will be called automatically by the virtualizer
              // when measureElement returns the updated height
            }
          }
          return height + GROUP_SPACING;
        },
        [filteredGroups],
      ),
    });

    /**
     * 背景（コンテナ自身）がクリックされた場合に写真の選択を解除するハンドラ
     */
    const handleBackgroundClick = useCallback(
      (
        event:
          | React.MouseEvent<HTMLDivElement>
          | React.KeyboardEvent<HTMLDivElement>,
      ) => {
        if (event.target === containerRef.current && isMultiSelectMode) {
          setSelectedPhotos(new Set());
          setIsMultiSelectMode(false);
        }
      },
      [isMultiSelectMode, setSelectedPhotos, setIsMultiSelectMode],
    );

    if (isLoadingGrouping) {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {Array.from({ length: 3 }).map((_, _i) => (
            <SkeletonGroup key={`skeleton-group-${crypto.randomUUID()}`} />
          ))}
        </div>
      );
    }

    return (
      <GalleryErrorBoundary>
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 photo-gallery-container"
          onClick={handleBackgroundClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleBackgroundClick(e);
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="ギャラリー背景"
        >
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
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="photo-group"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translate3d(0, ${virtualRow.start}px, 0)`,
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
                    {group.photos.length > 0 && (
                      <PhotoGrid
                        worldId={group.worldInfo?.worldId ?? null}
                        photos={group.photos}
                        onPhotoSelect={setSelectedPhoto}
                        selectedPhotos={selectedPhotos}
                        setSelectedPhotos={setSelectedPhotos}
                        isMultiSelectMode={isMultiSelectMode}
                        setIsMultiSelectMode={setIsMultiSelectMode}
                      />
                    )}
                  </div>
                  <MeasurePhotoGroup
                    photos={group.photos}
                    onMeasure={(height) => {
                      const previousHeight =
                        groupSizesRef.current.get(key) || 0;

                      // Only update if height changed significantly
                      if (Math.abs(height - previousHeight) > 1) {
                        groupSizesRef.current.set(key, height);
                        // Use requestAnimationFrame to avoid layout thrashing
                        requestAnimationFrame(() => {
                          virtualizer.measure();
                        });
                      }
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
