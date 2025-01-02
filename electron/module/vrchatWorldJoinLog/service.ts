import type { VRChatWorldJoinLog } from '../vrchatLog/service';
import * as model from './VRChatWorldJoinLogModel/s_model';

export const createVRChatWorldJoinLogModel = async (
  vrchatWorldJoinLogList: VRChatWorldJoinLog[],
): Promise<model.VRChatWorldJoinLogModel[]> => {
  return model.createVRChatWorldJoinLog(vrchatWorldJoinLogList);
};

export const findAllVRChatWorldJoinLogList = async (): Promise<
  model.VRChatWorldJoinLogModel[]
> => {
  return model.findAllVRChatWorldJoinLogList();
};

export const findVRChatWorldJoinLogList = async ({
  gtJoinDateTime,
  ltJoinDateTime,
  orderByJoinDateTime,
}: {
  gtJoinDateTime?: Date;
  ltJoinDateTime?: Date;
  orderByJoinDateTime: 'asc' | 'desc';
}) => {
  const modelList = await model.findVRChatWorldJoinLogList({
    gtJoinDateTime,
    ltJoinDateTime,
    orderByJoinDateTime,
  });
  return modelList.map((m) => {
    return {
      id: m.id as string,
      worldId: m.worldId,
      worldName: m.worldName,
      worldInstanceId: m.worldInstanceId,
      joinDateTime: m.joinDateTime,
      createdAt: m.createdAt as Date,
      updatedAt: m.updatedAt as Date,
    };
  });
};

export const findRecentVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  return model.findRecentVRChatWorldJoinLog({
    dateTime: joinDateTime,
  });
};

export const findNextVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  return model.findNextVRChatWorldJoinLog(joinDateTime);
};
