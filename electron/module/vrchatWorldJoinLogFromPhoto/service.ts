import * as Model from './vrchatWorldJoinLogFromPhoto.model';
import type { VRChatWorldJoinLogFromPhoto } from './vrchatWorldJoinLogFromPhoto.model';

export const createVRChatWorldJoinLogFromPhoto = async (
  logs: VRChatWorldJoinLogFromPhoto[],
) => {
  const createdLogs = await Model.createVRChatWorldJoinLogFromPhoto(
    logs.map((log) => ({
      worldId: log.worldId,
      joinDate: log.joinDate,
    })),
  );

  return createdLogs;
};

export const findVRChatWorldJoinLogFromPhotoList = async (query?: {
  gtJoinDateTime?: Date;
  ltJoinDateTime?: Date;
  orderByJoinDateTime: 'asc' | 'desc';
}) => {
  const modelList = await Model.findVRChatWorldJoinLogFromPhotoList(query);
  return modelList.map((m) => {
    return {
      id: m.id as string,
      worldId: m.worldId,
      joinDate: m.joinDateTime,
      createdAt: m.createdAt as Date,
      updatedAt: m.updatedAt as Date | null,
    };
  });
};
