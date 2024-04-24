import * as neverthrow from 'neverthrow';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
} from '../vrchatLog/service';
import { procedure, router as trpcRouter } from './../../trpc';
import { getRDBClient } from './model';
import { resetDatabase } from './util';
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

  const client = getRDBClient();
  await client.createVRChatWorldJoinLog(worldJoinLogList);
  // await client.createVRChatPlayerJoinLog(playerJoinLogList);
  console.log('playerJoinLogList', playerJoinLogList);
  return neverthrow.ok(undefined);
};

const getVRCWorldJoinLogList = async () => {
  const client = getRDBClient();
  const joinLogList = await client.findAllVRChatWorldJoinLogList();
  return joinLogList;
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
  const client = getRDBClient();
  const joinLogList = await client.findRecentVRChatWorldJoinLog(
    vrchatPhotoName.photoTakenDateTime,
  );
  if (joinLogList === null) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND' as const);
  }
  return neverthrow.ok(joinLogList);
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
      await resetDatabase();
    }),
  });
