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
