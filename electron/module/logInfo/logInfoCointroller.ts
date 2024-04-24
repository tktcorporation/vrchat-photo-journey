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

  const client = getRDBClient();
  await client.createVRChatWorldJoinLog(worldJoinLogList);
  // await client.createVRChatPlayerJoinLog(playerJoinLogList);
  console.log('playerJoinLogList', playerJoinLogList);
  return neverthrow.ok(undefined);
};

export const getVRCWorldJoinLogList = async () => {
  const client = getRDBClient();
  const joinLogList = await client.findAllVRChatWorldJoinLogList();
  return joinLogList;
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
    resetDatabase: procedure.mutation(async () => {
      await resetDatabase();
    }),
  });
