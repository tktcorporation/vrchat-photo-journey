import { useVirtualizer } from '@tanstack/react-virtual';
import { LoaderCircle } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseLoadingStateResult } from '../../hooks/useLoadingState';
import { AppHeader } from '../AppHeader';
import { DateJump } from '../DateJump';
import { LocationGroupHeader } from '../LocationGroupHeader';
import type { PhotoGalleryData } from '../PhotoGallery';
import PhotoGrid from '../PhotoGrid';
import { GalleryErrorBoundary } from './GalleryErrorBoundary';
import { MeasurePhotoGroup } from './MeasurePhotoGroup';
import { usePhotoGalleryPaginated } from './usePhotoGalleryPaginated';

interface GalleryContentPaginatedProps
  extends Pick<
    UseLoadingStateResult,
    'isLoadingStartupSync' | 'isLoadingGrouping' | 'finishLoadingGrouping'
  > {
  searchQuery: string;
  searchType?: 'world' | 'player';
  galleryData?: PhotoGalleryData;
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

const InfiniteScrollTrigger = memo(function InfiniteScrollTrigger({
  onTrigger,
  hasNextPage,
  isFetchingNextPage,
}: {
  onTrigger: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onTrigger();
        }
      },
      { threshold: 0.1 },
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [onTrigger, hasNextPage, isFetchingNextPage]);

  if (!hasNextPage) return null;

  return (
    <div ref={triggerRef} className="flex justify-center py-8">
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>写真を読み込み中...</span>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          スクロールして続きを読み込み
        </div>
      )}
    </div>
  );
});

/**
 * ページネーション対応の写真グリッドを表示するメインコンテンツエリア
 * 無限スクロール + バーチャルスクロールの組み合わせで大量写真を効率処理
 */
export const GalleryContentPaginated = memo(function GalleryContentPaginated({
  searchQuery: initialSearchQuery,
  searchType: initialSearchType,
  isLoadingStartupSync,
  finishLoadingGrouping,
  galleryData,
}: GalleryContentPaginatedProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchType, setSearchType] = useState(initialSearchType);
  const {
    groupedPhotos,
    isLoading,
    selectedPhotos,
    setSelectedPhotos,
    isMultiSelectMode,
    setIsMultiSelectMode,
    setSelectedPhoto: _setSelectedPhoto,
    debug: _debug,
    loadNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePhotoGalleryPaginated(searchQuery, searchType, {
    onGroupingEnd: finishLoadingGrouping,
    pageSize: 1000,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const groupSizesRef = useRef<Map<string, number>>(new Map());
  const [currentVisibleGroups, setCurrentVisibleGroups] = useState<Set<string>>(
    new Set(),
  );

  const filteredGroups = useMemo(() => {
    return Object.entries(groupedPhotos).sort(
      ([, a], [, b]) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
    );
  }, [groupedPhotos]);

  const virtualizer = useVirtualizer({
    count: filteredGroups.length,
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback(
      (index) => {
        const [key] = filteredGroups[index];
        return (groupSizesRef.current.get(key) ?? 0) + GROUP_SPACING;
      },
      [filteredGroups],
    ),
    overscan: 3,
    measureElement: useCallback((element: HTMLElement) => {
      const height = element.getBoundingClientRect().height;
      const key = element.getAttribute('data-key');
      if (key) {
        groupSizesRef.current.set(key, height);
      }
      return height + GROUP_SPACING;
    }, []),
  });

  // 無限スクロールトリガー - 最後から5アイテム前で発火
  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    if (items.length === 0) return;

    const lastItem = items[items.length - 1];
    const triggerThreshold = Math.max(0, filteredGroups.length - 5);

    if (
      lastItem.index >= triggerThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      loadNextPage();
    }
  }, [
    virtualizer.getVirtualItems(),
    filteredGroups.length,
    hasNextPage,
    isFetchingNextPage,
    loadNextPage,
  ]);

  // 現在表示されているグループを追跡
  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    const visibleGroupKeys = new Set(
      items.map((item) => filteredGroups[item.index]?.[0]).filter(Boolean),
    );
    setCurrentVisibleGroups(visibleGroupKeys);
  }, [virtualizer.getVirtualItems(), filteredGroups]);

  // 日付ジャンプ機能
  const handleJumpToDate = useCallback(
    (_groupKey: string, index: number) => {
      // 必要に応じて追加データを読み込む
      if (
        index >= filteredGroups.length - 10 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        loadNextPage();
      }

      // 指定されたインデックスにスクロール
      virtualizer.scrollToIndex(index, {
        align: 'start',
        behavior: 'smooth',
      });
    },
    [
      virtualizer,
      filteredGroups.length,
      hasNextPage,
      isFetchingNextPage,
      loadNextPage,
    ],
  );

  const showLoadingState =
    isLoadingStartupSync || (isLoading && filteredGroups.length === 0);

  return (
    <GalleryErrorBoundary>
      <div className="flex h-full flex-col">
        <AppHeader
          searchQuery={searchQuery}
          setSearchQuery={(query, type) => {
            setSearchQuery(query);
            setSearchType(type);
          }}
          onOpenSettings={galleryData?.onOpenSettings}
          selectedPhotoCount={selectedPhotos.size}
          onClearSelection={() => setSelectedPhotos(new Set())}
          isMultiSelectMode={isMultiSelectMode}
          onCopySelected={galleryData?.onCopySelected}
          loadingState={galleryData?.loadingState}
        />

        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4"
          style={{ height: '100%' }}
        >
          {showLoadingState ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map(() => (
                <SkeletonGroup key={crypto.randomUUID()} />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">
                  写真が見つかりませんでした
                </p>
                <p className="text-sm">
                  検索条件を変更するか、VRChatで写真を撮影してください
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const [key, group] = filteredGroups[virtualItem.index];

                return (
                  <div
                    key={virtualItem.key}
                    data-key={key}
                    ref={(el) => {
                      if (el) virtualizer.measureElement(el);
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="mb-8">
                      <LocationGroupHeader
                        worldId={group.worldInfo?.worldId ?? null}
                        worldName={group.worldInfo?.worldName ?? null}
                        worldInstanceId={
                          group.worldInfo?.worldInstanceId ?? null
                        }
                        photoCount={group.photos.length}
                        joinDateTime={group.joinDateTime}
                      />

                      <div className="mt-4">
                        <MeasurePhotoGroup
                          photos={group.photos}
                          onMeasure={() => {
                            // Measurement is handled by parent ref
                          }}
                        />
                        <PhotoGrid
                          photos={group.photos}
                          selectedPhotos={selectedPhotos}
                          setSelectedPhotos={setSelectedPhotos}
                          isMultiSelectMode={isMultiSelectMode}
                          setIsMultiSelectMode={setIsMultiSelectMode}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 無限スクロールトリガー */}
              <div
                style={{
                  position: 'absolute',
                  top: `${virtualizer.getTotalSize()}px`,
                  left: 0,
                  width: '100%',
                }}
              >
                <InfiniteScrollTrigger
                  onTrigger={loadNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            </div>
          )}
        </div>

        {/* 日付ジャンプ */}
        <DateJump
          filteredGroups={filteredGroups}
          onJumpToDate={handleJumpToDate}
          currentVisibleGroups={currentVisibleGroups}
        />
      </div>
    </GalleryErrorBoundary>
  );
});

export default GalleryContentPaginated;
