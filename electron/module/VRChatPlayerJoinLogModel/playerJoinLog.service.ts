import type { VRChatPlayerJoinLog } from '../vrchatLog/service';
import * as model from './playerJoinInfoLog.model';

export const createVRChatPlayerJoinLogModel = (
  playerJoinLogList: VRChatPlayerJoinLog[],
) => {
  return model.createVRChatPlayerJoinLog(playerJoinLogList);
};

export const getVRChatPlayerJoinLogListByJoinDateTime = (props: {
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
      startJoinDateTime: props.startJoinDateTime,
      endJoinDateTime: props.endJoinDateTime, // null
      // 最大7日分取得
      getUntilDays: 7,
    });
  }
  return model.getVRChatPlayerJoinLogListByJoinDateTime({
    startJoinDateTime: props.startJoinDateTime,
    endJoinDateTime: props.endJoinDateTime,
    getUntilDays: null,
  });
};
