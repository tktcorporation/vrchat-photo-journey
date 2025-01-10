import type { trpcReact } from '@/trpc';

export const invalidatePhotoGalleryQueries = (
  trpsUtils: ReturnType<typeof trpcReact.useUtils>,
) => {
  trpsUtils.vrchatWorldJoinLog.getVRChatWorldJoinLogList.invalidate();
  trpsUtils.vrchatPhoto.getVrchatPhotoPathModelList.invalidate();
};
