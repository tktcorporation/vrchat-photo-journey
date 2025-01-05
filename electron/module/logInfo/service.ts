import * as neverthrow from 'neverthrow';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import {
  type VRChatPlayerJoinLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
} from '../vrchatLog/service';
import type { VRChatPhotoPathModel } from '../vrchatPhoto/model/vrchatPhotoPath.model';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';

const BATCH_SIZE = 1000; // 一度に処理するログの数

interface LogProcessingResults {
  createdVRChatPhotoPathModelList: VRChatPhotoPathModel[];
  createdWorldJoinLogModelList: VRChatWorldJoinLogModel[];
  createdPlayerJoinLogModelList: VRChatPlayerJoinLogModel[];
}

export const loadLogInfoIndexFromVRChatLog = async () => {
  const logStoreFilePath = getLogStoreFilePath();

  // DBから最新のログ日時を取得
  const [latestWorldJoinDate, latestPlayerJoinDate] = await Promise.all([
    worldJoinLogService.findLatestWorldJoinLog(),
    playerJoinLogService.findLatestPlayerJoinLog(),
  ]);

  const logInfoList = await getVRChaLogInfoByLogFilePathList([
    logStoreFilePath,
  ]);
  if (logInfoList.isErr()) {
    return neverthrow.err(logInfoList.error);
  }

  // DBの最新日時以降のログのみをフィルタリング
  const newLogs = logInfoList.value.filter((log) => {
    if (log.logType === 'worldJoin') {
      return (
        !latestWorldJoinDate ||
        new Date(log.joinDate) > new Date(latestWorldJoinDate.joinDateTime)
      );
    }
    return (
      !latestPlayerJoinDate ||
      new Date(log.joinDate) > new Date(latestPlayerJoinDate.joinDateTime)
    );
  });

  const results: LogProcessingResults = {
    createdVRChatPhotoPathModelList: [],
    createdWorldJoinLogModelList: [],
    createdPlayerJoinLogModelList: [],
  };

  // バッチ処理の実装
  for (let i = 0; i < newLogs.length; i += BATCH_SIZE) {
    const batch = newLogs.slice(i, i + BATCH_SIZE);

    const worldJoinLogBatch = batch.filter(
      (log): log is VRChatWorldJoinLog => log.logType === 'worldJoin',
    );
    const playerJoinLogBatch = batch.filter(
      (log): log is VRChatPlayerJoinLog => log.logType === 'playerJoin',
    );

    const [worldJoinResults, playerJoinResults] = await Promise.all([
      worldJoinLogService.createVRChatWorldJoinLogModel(worldJoinLogBatch),
      playerJoinLogService.createVRChatPlayerJoinLogModel(playerJoinLogBatch),
    ]);

    results.createdWorldJoinLogModelList =
      results.createdWorldJoinLogModelList.concat(worldJoinResults);
    results.createdPlayerJoinLogModelList =
      results.createdPlayerJoinLogModelList.concat(playerJoinResults);
  }

  // 写真のインデックスも同様に最新日時以降のみを処理
  const latestPhoto = await vrchatPhotoService.getLatestPhotoDate();
  const photoResults =
    await vrchatPhotoService.createVRChatPhotoPathIndex(latestPhoto);
  results.createdVRChatPhotoPathModelList = photoResults;

  return neverthrow.ok(results);
};
