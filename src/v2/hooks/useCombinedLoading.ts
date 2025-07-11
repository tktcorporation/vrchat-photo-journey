/**
 * 複数のローディング状態を結合するユーティリティフック
 *
 * 複数のクエリや処理のローディング状態を統一して管理する場合に使用
 * いずれかがtrueの場合、全体のローディング状態がtrueとなる
 *
 * @param loadingStates - ローディング状態の配列
 * @returns 統合されたローディング状態
 *
 * @example
 * const isLoading = useCombinedLoading(
 *   isLoadingPhotos,
 *   isLoadingGrouping,
 *   isLoadingPlayerSearch
 * );
 */
export const useCombinedLoading = (...loadingStates: boolean[]): boolean => {
  return loadingStates.some(Boolean);
};
