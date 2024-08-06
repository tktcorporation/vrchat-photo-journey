import type { VRChatPlayerJoinLog } from '../vrchatLog/service';
import * as model from './playerJoinInfoLog.model';

export const createVRChatPlayerJoinLogModel = (
  playerJoinLogList: VRChatPlayerJoinLog[],
) => {
  return model.createVRChatPlayerJoinLog(playerJoinLogList);
};

export const getVRChatPlayerJoinLogListByJoinDateTime = async (props: {
  startJoinDateTime: Date;
  endJoinDateTime: Date | null;
}): Promise<
  {
    id: string;
    playerId: string | null;
    playerName: string;
    joinDateTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }[]
> => {
  if (props.endJoinDateTime === null) {
    return model.getVRChatPlayerJoinLogListByJoinDateTime({
      gteJoinDateTime: props.startJoinDateTime,
      ltJoinDateTime: props.endJoinDateTime, // null
      // 最大7日分取得
      getUntilDays: 7,
    });
  }
  const modelList = await model.getVRChatPlayerJoinLogListByJoinDateTime({
    gteJoinDateTime: props.startJoinDateTime,
    ltJoinDateTime: props.endJoinDateTime,
    getUntilDays: null,
  });
  return modelList.map((model) => ({
    id: model.id,
    playerId: model.playerId,
    playerName: model.playerName,
    joinDateTime: model.joinDateTime,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  }));
};
