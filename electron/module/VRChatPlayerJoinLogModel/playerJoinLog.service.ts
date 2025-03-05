import { getDBQueue } from '../../lib/dbQueue';
import * as log from '../../lib/logger';
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
  const dbQueue = getDBQueue();

  try {
    let modelList: model.VRChatPlayerJoinLogModel[];

    if (props.endJoinDateTime === null) {
      modelList = await dbQueue.add(() =>
        model.getVRChatPlayerJoinLogListByJoinDateTime({
          gteJoinDateTime: props.startJoinDateTime,
          ltJoinDateTime: null,
          // 最大7日分取得
          getUntilDays: 7,
        }),
      );
    } else {
      const endDate: Date = props.endJoinDateTime;
      modelList = await dbQueue.add(() =>
        model.getVRChatPlayerJoinLogListByJoinDateTime({
          gteJoinDateTime: props.startJoinDateTime,
          ltJoinDateTime: endDate,
          getUntilDays: null,
        }),
      );
    }

    return modelList.map((model) => ({
      id: model.id,
      playerId: model.playerId,
      playerName: model.playerName,
      joinDateTime: model.joinDateTime,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }));
  } catch (error) {
    log.error({
      message: 'プレイヤー参加ログの取得中にエラーが発生しました',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
    // エラー時は空の配列を返す
    return [];
  }
};

export const getLatestDetectedDate = async (): Promise<string | null> => {
  const dbQueue = getDBQueue();
  try {
    const latestLog = await dbQueue.add(() => model.findLatestPlayerJoinLog());
    return latestLog?.joinDateTime.toISOString() ?? null;
  } catch (error) {
    log.error({
      message: '最新の検出日時の取得中にエラーが発生しました',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
};

export const findLatestPlayerJoinLog = async () => {
  const dbQueue = getDBQueue();
  try {
    return await dbQueue.add(() => model.findLatestPlayerJoinLog());
  } catch (error) {
    log.error({
      message: '最新のプレイヤー参加ログの取得中にエラーが発生しました',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
};
