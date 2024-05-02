import type { VRChatWorldJoinLog } from '../vrchatLog/service';
import * as model from './s_model';

export const createVRChatWorldJoinLogModel = async (
  vrchatWorldJoinLogList: VRChatWorldJoinLog[],
): Promise<void> => {
  await model.createVRChatWorldJoinLog(vrchatWorldJoinLogList);
};

export const findAllVRChatWorldJoinLogList = async (): Promise<
  model.VRChatWorldJoinLogModel[]
> => {
  return model.findAllVRChatWorldJoinLogList();
};

export const findRecentVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  return model.findRecentVRChatWorldJoinLog(joinDateTime);
};

export const findNextVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  return model.findNextVRChatWorldJoinLog(joinDateTime);
};
