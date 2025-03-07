import * as datefns from 'date-fns';
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
  getLogStoreFilePathsInRange,
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
  // 旧Appの形式のログファイル(写真)からログ情報を保存
  const vrChatPhotoDirPath = await getVRChatPhotoDirPath();
  await importLogLinesFromLogPhotoDirPath({
    vrChatPhotoDirPath,
  });

  // 最新のログを取得するための日付範囲を決定
  let startDate: Date;
  if (excludeOldLogLoad) {
    // DBの最新日時を取得
    const [
      latestWorldJoinDate,
      latestPlayerJoinDateResult,
      latestPlayerLeaveDate,
    ] = await Promise.all([
      worldJoinLogService.findLatestWorldJoinLog(),
      playerJoinLogService.findLatestPlayerJoinLog(),
      playerLeaveLogService.findLatestPlayerLeaveLog(),
    ]);

    // 最新の日時を取得（存在しない場合は1年前から）
    const dates = [
      latestWorldJoinDate?.joinDateTime,
      latestPlayerJoinDateResult.isOk() && latestPlayerJoinDateResult.value
        ? latestPlayerJoinDateResult.value.joinDateTime
        : null,
      latestPlayerLeaveDate?.leaveDateTime,
    ].filter(Boolean) as Date[];

    if (dates.length > 0) {
      // 最も古い日付の月の初日を開始日とする
      const timestamps = dates.map((d) => d.getTime());
      const oldestTimestamp = Math.min(...timestamps);
      const oldestDate = datefns.fromUnixTime(oldestTimestamp / 1000);
      startDate = datefns.startOfMonth(oldestDate);
    } else {
      // 最新のログがない場合は1年前から
      startDate = datefns.subYears(new Date(), 1);
    }
  } else {
    // すべてのログを読み込む場合は、非常に古い日付から（実質的にすべてのログを対象とする）
    startDate = datefns.parseISO('2000-01-01'); // 2000年1月1日（十分に古い日付）
  }

  // 日付範囲内のすべてのログファイルパスを取得
  const logStoreFilePaths = getLogStoreFilePathsInRange(startDate);

  // 現在の日付のログファイルも追加（これまでの形式との互換性のため）
  const currentLogStoreFilePath = getLogStoreFilePath();
  if (
    Array.isArray(logStoreFilePaths) &&
    !logStoreFilePaths.some((path) => path === currentLogStoreFilePath)
  ) {
    logStoreFilePaths.push(currentLogStoreFilePath);
  }

  // ログファイルからログ情報を取得
  const logInfoListFromLogFile =
    await getVRChaLogInfoByLogFilePathList(logStoreFilePaths);
  if (logInfoListFromLogFile.isErr()) {
    return neverthrow.err(logInfoListFromLogFile.error);
  }

  const logInfoList = logInfoListFromLogFile.value;

  const newLogs = await match(excludeOldLogLoad)
    // DBの最新日時以降のログのみをフィルタリング
    .with(true, async () => {
      // ログの最新日時を取得
      const [
        latestWorldJoinDate,
        latestPlayerJoinDateResult,
        latestPlayerLeaveDate,
      ] = await Promise.all([
        worldJoinLogService.findLatestWorldJoinLog(),
        playerJoinLogService.findLatestPlayerJoinLog(),
        playerLeaveLogService.findLatestPlayerLeaveLog(),
      ]);

      // playerJoinDateResultからvalueを取得
      const latestPlayerJoinDate = latestPlayerJoinDateResult.isErr()
        ? null
        : latestPlayerJoinDateResult.value;

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
    // すべてのログを読み込む
    .with(false, async () => logInfoList)
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
