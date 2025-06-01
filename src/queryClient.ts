import type { trpcReact } from '@/trpc';

/**
 * PathSettings やヘッダーの更新処理で呼び出され、
 * tRPC クエリキャッシュを無効化して最新のギャラリーデータを再取得させる。
 */
export const invalidatePhotoGalleryQueries = (
  trpsUtils: ReturnType<typeof trpcReact.useUtils>,
) => {
  trpsUtils.vrchatWorldJoinLog.getVRChatWorldJoinLogList.invalidate();
  trpsUtils.vrchatPhoto.getVrchatPhotoPathModelList.invalidate();
};
