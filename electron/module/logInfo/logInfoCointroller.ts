import * as neverthrow from 'neverthrow';
import { syncForceRDBClient } from '../../lib/sequelize';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
} from '../vrchatLog/service';
import { procedure, router as trpcRouter } from './../../trpc';
import * as model from './s_model';
import {
  type VRChatPhotoFileNameWithExt,
  VRChatPhotoFileNameWithExtSchema,
} from './valueObjects';

const loadIndex = async () => {
  const logStoreFilePath = getLogStoreFilePath();
  const logInfoList = await getVRChaLogInfoByLogFilePathList([
    logStoreFilePath,
  ]);
  if (logInfoList.isErr()) {
    return neverthrow.err(logInfoList.error);
  }
  const worldJoinLogList = logInfoList.value.filter(
    (log): log is VRChatWorldJoinLog => log.logType === 'worldJoin',
  );
  const playerJoinLogList = logInfoList.value.filter(
    (log): log is VRChatPlayerJoinLog => log.logType === 'playerJoin',
  );

  await model.createVRChatWorldJoinLog(worldJoinLogList);
  // await client.createVRChatPlayerJoinLog(playerJoinLogList);
  console.log('playerJoinLogList', playerJoinLogList);
  return neverthrow.ok(undefined);
};

const getVRCWorldJoinLogList = async () => {
  const joinLogList = await model.findAllVRChatWorldJoinLogList();
  return joinLogList.map((joinLog) => {
    return {
      id: joinLog.id as string,
      worldId: joinLog.worldId,
      worldName: joinLog.worldName,
      worldInstanceId: joinLog.worldInstanceId,
      joinDateTime: joinLog.joinDateTime,
      createdAt: joinLog.createdAt as Date,
      updatedAt: joinLog.updatedAt as Date,
    };
  });
};

export const getRecentVRChatWorldJoinLogByVRChatPhotoName = async (
  vrchatPhotoName: VRChatPhotoFileNameWithExt,
): Promise<
  neverthrow.Result<
    {
      id: string;
      worldId: string;
      worldName: string;
      worldInstanceId: string;
      joinDateTime: Date;
      createdAt: Date;
      updatedAt: Date;
    },
    'RECENT_JOIN_LOG_NOT_FOUND'
  >
> => {
  const joinLog = await model.findRecentVRChatWorldJoinLog(
    vrchatPhotoName.photoTakenDateTime,
  );
  if (joinLog === null) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND' as const);
  }
  return neverthrow.ok({
    id: joinLog.id as string,
    worldId: joinLog.worldId,
    worldName: joinLog.worldName,
    worldInstanceId: joinLog.worldInstanceId,
    joinDateTime: joinLog.joinDateTime,
    createdAt: joinLog.createdAt as Date,
    updatedAt: joinLog.updatedAt as Date,
  });
};

export const logInfoRouter = () =>
  trpcRouter({
    loadLogInfoIndex: procedure.mutation(async () => {
      const result = await loadIndex();
      if (result.isErr()) {
        return neverthrow.err(result.error);
      }
    }),
    getVRCWorldJoinLogList: procedure.query(async () => {
      const joinLogList = await getVRCWorldJoinLogList();
      return joinLogList;
    }),
    getRecentVRChatWorldJoinLogByVRChatPhotoName: procedure
      .input(VRChatPhotoFileNameWithExtSchema)
      .query(async (ctx) => {
        const joinLogResult =
          await getRecentVRChatWorldJoinLogByVRChatPhotoName(ctx.input);
        return joinLogResult.match(
          (value) => {
            return value;
          },
          (error) => {
            throw error;
          },
        );
      }),
    resetDatabase: procedure.mutation(async () => {
      await syncForceRDBClient();
    }),
  });
