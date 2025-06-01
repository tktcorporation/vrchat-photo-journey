import type { trpcReact } from '@/trpc';

/**
 * 写真ギャラリー関連の tRPC クエリを再取得させるためのユーティリティ関数。
 * `PathSettings` や `PhotoGallery/Header` などから呼び出され、
 * データ更新後にキャッシュを無効化して UI を最新状態に保つ。
 */
export const invalidatePhotoGalleryQueries = (
  trpsUtils: ReturnType<typeof trpcReact.useUtils>,
) => {
  trpsUtils.vrchatWorldJoinLog.getVRChatWorldJoinLogList.invalidate();
  trpsUtils.vrchatPhoto.getVrchatPhotoPathModelList.invalidate();
};
