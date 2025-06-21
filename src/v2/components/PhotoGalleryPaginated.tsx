import type React from 'react';
import { memo, useMemo } from 'react';
import { useLoadingState } from '../hooks/useLoadingState';
import { GalleryContentPaginated } from './PhotoGallery/GalleryContentPaginated';

/**
 * ページネーション対応フォトギャラリーのプロパティ
 */
export interface PhotoGalleryPaginatedData {
  /** デバッグ情報 */
  debugInfo?: {
    totalPhotosFromSource: number;
    filteredPhotosCount: number;
    displayedGroupsCount: number;
    totalPhotosFromHook: number;
    totalGroupsFromHook: number;
    paginationInfo?: {
      totalCount: number;
      loadedPages: number;
      hasNextPage: boolean;
    };
  };
}

interface PhotoGalleryPaginatedProps {
  /** ヘッダーから渡される検索クエリ */
  searchQuery: string;
  /** 検索タイプ（world | player | undefined） */
  searchType?: 'world' | 'player';
}

/**
 * VRChat写真ギャラリーコンポーネント（ページネーション対応版）
 *
 * 無限スクロール + バーチャルスクロールで大量の写真を効率的に表示します。
 * 段階的データロードにより、メモリ使用量を抑制しつつスムーズなUXを実現します。
 *
 * ## 主な特徴
 * - 無限スクロールによる段階的データ取得
 * - バーチャルスクロールによる表示最適化
 * - セッション別グルーピング機能
 * - プレイヤー・ワールド検索対応
 * - 写真選択・プレビュー機能
 *
 * @param searchQuery - 検索クエリ文字列
 * @param searchType - 検索タイプ（world | player）
 */
export const PhotoGalleryPaginated = memo(function PhotoGalleryPaginated({
  searchQuery,
  searchType,
}: PhotoGalleryPaginatedProps) {
  const loadingState = useLoadingState();

  // PhotoGalleryDataの必須プロパティを提供
  const galleryData = useMemo(
    () => ({
      searchQuery,
      setSearchQuery: () => {}, // ダミー実装
      onOpenSettings: () => {}, // ダミー実装
      selectedPhotoCount: 0,
      onClearSelection: () => {}, // ダミー実装
      isMultiSelectMode: false,
      onCopySelected: () => {}, // ダミー実装
      loadingState: {
        isRefreshing: loadingState.isRefreshing,
        startRefreshing: loadingState.startRefreshing,
        finishRefreshing: loadingState.finishRefreshing,
      },
    }),
    [searchQuery, loadingState],
  );

  return (
    <>
      <GalleryContentPaginated
        searchQuery={searchQuery}
        searchType={searchType}
        galleryData={galleryData}
        {...loadingState}
      />
    </>
  );
});

export default PhotoGalleryPaginated;
