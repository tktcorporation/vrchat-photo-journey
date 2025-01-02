import * as neverthrow from 'neverthrow';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
} from '../vrchatLog/service';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';

export const loadLogInfoIndexFromVRChatLog = async () => {
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

  const createdWorldJoinLogModelList =
    await worldJoinLogService.createVRChatWorldJoinLogModel(worldJoinLogList);
  const createdPlayerJoinLogModelList =
    await playerJoinLogService.createVRChatPlayerJoinLogModel(
      playerJoinLogList,
    );

  const createdVRChatPhotoPathModelList =
    await vrchatPhotoService.createVRChatPhotoPathIndex();

  return neverthrow.ok({
    createdVRChatPhotoPathModelList: createdVRChatPhotoPathModelList,
    createdWorldJoinLogModelList: createdWorldJoinLogModelList,
    createdPlayerJoinLogModelList: createdPlayerJoinLogModelList,
  });
};
