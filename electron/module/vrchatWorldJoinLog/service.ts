import { enqueueTask } from '../../lib/dbHelper';
import { logger } from '../../lib/logger';
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
      updatedAt: m.updatedAt as Date | null,
    };
  });
};

export const findRecentVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  const result = await enqueueTask(() =>
    model.findRecentVRChatWorldJoinLog({
      dateTime: joinDateTime,
    }),
  );

  if (result.isErr()) {
    logger.error({
      message: '直近のワールド参加ログ取得中にエラーが発生しました',
      stack: new Error(JSON.stringify(result.error)),
    });
    return null;
  }
  return result.value;
};

export const findNextVRChatWorldJoinLog = async (
  joinDateTime: Date,
): Promise<model.VRChatWorldJoinLogModel | null> => {
  const result = await enqueueTask(() =>
    model.findNextVRChatWorldJoinLog(joinDateTime),
  );

  if (result.isErr()) {
    logger.error({
      message: '次のワールド参加ログ取得中にエラーが発生しました',
      stack: new Error(JSON.stringify(result.error)),
    });
    return null;
  }
  return result.value;
};

export const findLatestWorldJoinLog = async () => {
  const result = await enqueueTask(() => model.findLatestWorldJoinLog());

  if (result.isErr()) {
    logger.error({
      message: '最新のワールド参加ログ取得中にエラーが発生しました',
      stack: new Error(JSON.stringify(result.error)),
    });
    return null;
  }
  return result.value;
};

type VRChatWorldJoinLogWithSource = {
  id: string;
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date | null;
};

/**
 * 通常のログと写真から取得したログをマージします
 * 重複がある場合は通常のログを優先します
 */
export const mergeVRChatWorldJoinLogs = ({
  normalLogs,
  photoLogs,
}: {
  normalLogs: VRChatWorldJoinLogWithSource[];
  photoLogs: {
    id: string;
    worldId: string;
    joinDate: Date;
    createdAt: Date;
    updatedAt: Date | null;
  }[];
}): VRChatWorldJoinLogWithSource[] => {
  // 写真から取得したログを通常のログの形式に変換
  const convertedPhotoLogs: VRChatWorldJoinLogWithSource[] = photoLogs.map(
    (log) => ({
      id: log.id,
      worldId: log.worldId,
      worldName: log.worldId, // 写真からは取得できない
      worldInstanceId: '', // 写真からは取得できない
      joinDateTime: log.joinDate,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }),
  );

  // 写真から取得したログから、通常のログと重複するものを除外
  const uniquePhotoLogs = convertedPhotoLogs.filter((photoLog) => {
    return !normalLogs.some(
      (normalLog) =>
        normalLog.worldId === photoLog.worldId &&
        normalLog.joinDateTime.getTime() === photoLog.joinDateTime.getTime(),
    );
  });

  return [...normalLogs, ...uniquePhotoLogs];
};
