import path from 'node:path';
import * as neverthrow from 'neverthrow';
import { getAppUserDataPath } from '../lib/wrappedApp';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
} from '../vrchatLog/service';
import { procedure, router as trpcRouter } from './../../trpc';
import { getRDBClient } from './model';
import { resetDatabase } from './util';

const dbPath = path.join([getAppUserDataPath(), 'db', 'log.db'].join(path.sep));

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
  const client = getRDBClient(dbPath);
  await client.createVRChatWorldJoinLog(worldJoinLogList);
  // await client.createVRChatPlayerJoinLog(playerJoinLogList);
  console.log(playerJoinLogList);
  return neverthrow.ok(undefined);
};

export const logInfoRouter = () =>
  trpcRouter({
    loadLogInfoIndex: procedure.mutation(async () => {
      const result = await loadIndex();
      if (result.isErr()) {
        return neverthrow.err(result.error);
      }
      return neverthrow.ok(result.value);
    }),
    resetDatabase: procedure.mutation(async () => {
      await resetDatabase(dbPath);
      return neverthrow.ok(undefined);
    }),
  });
