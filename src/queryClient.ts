import type { trpcReact } from '@/trpc';

/**
 * 写真ギャラリー関連の tRPC クエリを再取得させるためのユーティリティ関数。
 * `PathSettings` や `PhotoGallery/Header` などから呼び出され、
 * tRPC クエリキャッシュを無効化して最新のギャラリーデータを再取得させる。
 */
export const invalidatePhotoGalleryQueries = (
  trpsUtils: ReturnType<typeof trpcReact.useUtils>,
) => {
  trpsUtils.vrchatWorldJoinLog.getVRChatWorldJoinLogList.invalidate();
  trpsUtils.vrchatPhoto.getVrchatPhotoPathModelList.invalidate();
};
