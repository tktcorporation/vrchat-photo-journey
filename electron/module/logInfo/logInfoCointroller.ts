import path from 'node:path';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import { getAppUserDataPath } from '../lib/wrappedApp';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import { procedure, router as trpcRouter } from './../../trpc';
import { getRDBClient } from './model';

export const loadIndex = async () => {
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

  // TODO: singleton にするのが良さそう
  const client = getRDBClient(
    path.join([getAppUserDataPath(), 'db', 'log.db'].join(path.sep)),
  );
  await client.createVRChatWorldJoinLog(worldJoinLogList);
  // await client.createVRChatPlayerJoinLog(playerJoinLogList);
  console.log(playerJoinLogList);
};

export const logInfoRouter = () =>
  trpcRouter({
    loadLogInfoIndex: procedure.mutation(async () => {
      await loadIndex();
    }),
  });
