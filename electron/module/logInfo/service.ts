import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatPlayerLeaveLogModel } from '../VRChatPlayerLeaveLogModel/playerLeaveLog.model';
import * as playerLeaveLogService from '../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import {
  type VRChatPlayerJoinLog,
  type VRChatPlayerLeaveLog,
  type VRChatWorldJoinLog,
  getLogStoreFilePath,
  getVRChaLogInfoByLogFilePathList,
  importLogLinesFromLogPhotoDirPath,
} from '../vrchatLog/service';
import type { VRChatPhotoPathModel } from '../vrchatPhoto/model/vrchatPhotoPath.model';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import { getVRChatPhotoDirPath } from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
const BATCH_SIZE = 1000; // 一度に処理するログの数

interface LogProcessingResults {
  createdVRChatPhotoPathModelList: VRChatPhotoPathModel[];
  createdWorldJoinLogModelList: VRChatWorldJoinLogModel[];
  createdPlayerJoinLogModelList: VRChatPlayerJoinLogModel[];
  createdPlayerLeaveLogModelList: VRChatPlayerLeaveLogModel[];
}

export const loadLogInfoIndexFromVRChatLog = async ({
  excludeOldLogLoad,
}: { excludeOldLogLoad: boolean }) => {
  const logStoreFilePath = getLogStoreFilePath();

  // 旧Appの形式のログファイル(写真)からログ情報を保存
  const vrChatPhotoDirPath = await getVRChatPhotoDirPath();
  await importLogLinesFromLogPhotoDirPath({
    vrChatPhotoDirPath,
  });

  // ログファイルからログ情報を取得
  const logInfoListFromLogFile = await getVRChaLogInfoByLogFilePathList([
    logStoreFilePath,
  ]);
  if (logInfoListFromLogFile.isErr()) {
    return neverthrow.err(logInfoListFromLogFile.error);
  }

  const logInfoList = logInfoListFromLogFile.value;

  const newLogs = await match(excludeOldLogLoad)
    // DBの最新日時以降のログのみをフィルタリング
    .with(true, async () => {
      // ログの最新日時を取得
      const [latestWorldJoinDate, latestPlayerJoinDate, latestPlayerLeaveDate] =
        await Promise.all([
          worldJoinLogService.findLatestWorldJoinLog(),
          playerJoinLogService.findLatestPlayerJoinLog(),
          playerLeaveLogService.findLatestPlayerLeaveLog(),
        ]);
      return logInfoList.filter((log) => {
        if (log.logType === 'worldJoin') {
          return (
            !latestWorldJoinDate ||
            log.joinDate > latestWorldJoinDate.joinDateTime
          );
        }
        if (log.logType === 'playerJoin') {
          return (
            !latestPlayerJoinDate ||
            log.joinDate > latestPlayerJoinDate.joinDateTime
          );
        }
        if (log.logType === 'playerLeave') {
          return (
            !latestPlayerLeaveDate ||
            log.leaveDate > latestPlayerLeaveDate.leaveDateTime
          );
        }
        return false;
      });
    })
    .with(false, () => logInfoList)
    .exhaustive();

  const results: LogProcessingResults = {
    createdVRChatPhotoPathModelList: [],
    createdWorldJoinLogModelList: [],
    createdPlayerJoinLogModelList: [],
    createdPlayerLeaveLogModelList: [],
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
    const playerLeaveLogBatch = batch.filter(
      (log): log is VRChatPlayerLeaveLog => log.logType === 'playerLeave',
    );

    const [worldJoinResults, playerJoinResults, playerLeaveResults] =
      await Promise.all([
        worldJoinLogService.createVRChatWorldJoinLogModel(worldJoinLogBatch),
        playerJoinLogService.createVRChatPlayerJoinLogModel(playerJoinLogBatch),
        playerLeaveLogService.createVRChatPlayerLeaveLogModel(
          playerLeaveLogBatch,
        ),
      ]);

    results.createdWorldJoinLogModelList =
      results.createdWorldJoinLogModelList.concat(worldJoinResults);
    results.createdPlayerJoinLogModelList =
      results.createdPlayerJoinLogModelList.concat(playerJoinResults);
    results.createdPlayerLeaveLogModelList =
      results.createdPlayerLeaveLogModelList.concat(playerLeaveResults);
  }

  // 写真のインデックスも同様にexcludeOldLogLoadに応じて最新日時以降のみを処理

  const latestPhotoDate = await match(excludeOldLogLoad)
    .with(true, async () => await vrchatPhotoService.getLatestPhotoDate())
    .with(false, () => null)
    .exhaustive();
  const photoResults =
    await vrchatPhotoService.createVRChatPhotoPathIndex(latestPhotoDate);
  results.createdVRChatPhotoPathModelList = photoResults;

  return neverthrow.ok(results);
};
