import { performance } from 'node:perf_hooks';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import { logger } from '../../lib/logger';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatPlayerLeaveLogModel } from '../VRChatPlayerLeaveLogModel/playerLeaveLog.model';
import * as playerLeaveLogService from '../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import type { VRChatLogFileError } from '../vrchatLog/error';
import type { VRChatLogStoreFilePath } from '../vrchatLog/model';
import * as vrchatLogService from '../vrchatLog/service';
import type {
  VRChatPlayerJoinLog,
  VRChatPlayerLeaveLog,
  VRChatWorldJoinLog,
} from '../vrchatLog/service';
import type { VRChatPhotoPathModel } from '../vrchatPhoto/model/vrchatPhotoPath.model';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';

interface LogProcessingResults {
  createdWorldJoinLogModelList: VRChatWorldJoinLogModel[];
  createdPlayerJoinLogModelList: VRChatPlayerJoinLogModel[];
  createdPlayerLeaveLogModelList: VRChatPlayerLeaveLogModel[];
  createdVRChatPhotoPathModelList: VRChatPhotoPathModel[];
}

/**
 * 処理対象となるVRChatのログファイルパスを取得する
 * @param excludeOldLogLoad trueの場合、DBに保存されている最新のログ日時以降のログのみを処理します。
 *                           falseの場合、2000年1月1日からすべてのログを処理します。
 */
async function _getLogStoreFilePaths(
  excludeOldLogLoad: boolean,
): Promise<VRChatLogStoreFilePath[]> {
  const startTime = performance.now();
  let startDate: Date;
  const logStoreFilePaths: VRChatLogStoreFilePath[] = [];

  if (excludeOldLogLoad) {
    const findLatestStartTime = performance.now();
    // DBに保存されている最新のログ日時を取得
    const [
      latestWorldJoinDate,
      latestPlayerJoinDateResult,
      latestPlayerLeaveDate,
    ] = await Promise.all([
      worldJoinLogService.findLatestWorldJoinLog(),
      playerJoinLogService.findLatestPlayerJoinLog(),
      playerLeaveLogService.findLatestPlayerLeaveLog(),
    ]);
    const findLatestEndTime = performance.now();
    logger.debug(
      `_getLogStoreFilePaths: Find latest logs took ${
        findLatestEndTime - findLatestStartTime
      } ms`,
    );

    const latestPlayerJoinDate = latestPlayerJoinDateResult.isOk()
      ? latestPlayerJoinDateResult.value?.joinDateTime
      : null;

    // 最新の日時をフィルタリングしてソート
    const dates = [
      latestWorldJoinDate?.joinDateTime,
      latestPlayerJoinDate,
      latestPlayerLeaveDate?.leaveDateTime,
    ]
      .filter((d): d is Date => d instanceof Date) // Date型のみをフィルタリング
      .sort(datefns.compareAsc);
    logger.debug(`_getLogStoreFilePaths: latest dates: ${dates}`);

    // 最新の日付を取得、なければ1年前
    startDate = dates.at(-1) ?? datefns.subYears(new Date(), 1);
  } else {
    // すべてのログを読み込む場合は、非常に古い日付から
    startDate = datefns.parseISO('2000-01-01');
    const getLegacyPathStartTime = performance.now();
    // 旧形式のログファイルも追加
    const legacyLogStoreFilePath =
      await vrchatLogService.getLegacyLogStoreFilePath();
    const getLegacyPathEndTime = performance.now();
    logger.debug(
      `_getLogStoreFilePaths: Get legacy log path took ${
        getLegacyPathEndTime - getLegacyPathStartTime
      } ms`,
    );
    if (legacyLogStoreFilePath) {
      logStoreFilePaths.push(legacyLogStoreFilePath);
    }
  }

  const getPathsInRangeStartTime = performance.now();
  // 日付範囲内のすべてのログファイルパスを取得して追加
  const pathsInRange = await vrchatLogService.getLogStoreFilePathsInRange(
    startDate,
    new Date(),
  );
  const getPathsInRangeEndTime = performance.now();
  logger.debug(
    `_getLogStoreFilePaths: Get paths in range took ${
      getPathsInRangeEndTime - getPathsInRangeStartTime
    } ms`,
  );
  logStoreFilePaths.push(...pathsInRange);

  const endTime = performance.now();
  logger.debug(`_getLogStoreFilePaths took ${endTime - startTime} ms`);

  return logStoreFilePaths;
}

/**
 * VRChatのログファイルからログ情報をロードしてデータベースに保存する
 *
 * @param options.excludeOldLogLoad - trueの場合、DBに保存されている最新のログ日時以降のログのみを処理します。
 *                                   falseの場合、2000年1月1日からすべてのログを処理します。
 *                                   デフォルトはfalseです。
 *
 * 処理の流れ:
 * 1. 写真フォルダからログ情報を読み込み、保存します
 *    - 写真フォルダが存在しない場合はスキップします（正常系）
 *    - 写真フォルダが存在する場合のみ、ログ情報を保存します
 *
 * 2. ログファイルの日付範囲を決定: ( _getLogStoreFilePaths に移動 )
 *
 * 3. ログのフィルタリング:
 *    - excludeOldLogLoad = true の場合:
 *      - World Join: 最新のWorldJoinLog以降
 *      - Player Join: 最新のPlayerJoinLog以降
 *      - Player Leave: 最新のPlayerLeaveLog以降
 *    - excludeOldLogLoad = false の場合:
 *      - すべてのログを処理
 *
 * 4. 写真のインデックス処理:
 *    - excludeOldLogLoad = true の場合:
 *      - 最新の写真日時以降のみを処理
 *    - excludeOldLogLoad = false の場合:
 *      - すべての写真を処理
 *
 * @returns 作成されたログモデルのリストを含むResultオブジェクト
 *          - createdWorldJoinLogModelList: 作成されたワールド参加ログ
 *          - createdPlayerJoinLogModelList: 作成されたプレイヤー参加ログ
 *          - createdPlayerLeaveLogModelList: 作成されたプレイヤー退出ログ
 *          - createdVRChatPhotoPathModelList: 作成された写真パスモデル
 */
export async function loadLogInfoIndexFromVRChatLog({
  excludeOldLogLoad = false,
}: {
  excludeOldLogLoad?: boolean;
} = {}): Promise<neverthrow.Result<LogProcessingResults, VRChatLogFileError>> {
  const totalStartTime = performance.now();
  logger.info('loadLogInfoIndexFromVRChatLog start');

  // 1. 写真フォルダからのログインポート
  const importLogPhotoStartTime = performance.now();
  const vrChatPhotoDirPath = await vrchatPhotoService.getVRChatPhotoDirPath();
  if (vrChatPhotoDirPath) {
    await vrchatLogService.importLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath,
    });
  }
  const importLogPhotoEndTime = performance.now();
  logger.debug(
    `Import log lines from photo dir took ${
      importLogPhotoEndTime - importLogPhotoStartTime
    } ms`,
  );

  // 2. 処理対象となるログファイルパスを取得
  const getLogPathsStartTime = performance.now();
  const logStoreFilePaths = await _getLogStoreFilePaths(excludeOldLogLoad);
  const getLogPathsEndTime = performance.now();
  logger.debug(
    `Get log store file paths took ${
      getLogPathsEndTime - getLogPathsStartTime
    } ms`,
  );
  logger.info(
    `loadLogInfoIndexFromVRChatLog target: ${logStoreFilePaths.map(
      (path) => path.value,
    )}`,
  );

  // 3. ログファイルからログ情報を取得
  const getLogInfoStartTime = performance.now();
  const logInfoListFromLogFile =
    await vrchatLogService.getVRChaLogInfoByLogFilePathList(logStoreFilePaths);
  const getLogInfoEndTime = performance.now();
  logger.debug(
    `Get VRChat log info from log files took ${
      getLogInfoEndTime - getLogInfoStartTime
    } ms`,
  );
  if (logInfoListFromLogFile.isErr()) {
    return neverthrow.err(logInfoListFromLogFile.error);
  }

  const logInfoList = logInfoListFromLogFile.value;

  const filterLogsStartTime = performance.now();
  const newLogs = await match(excludeOldLogLoad)
    // DBの最新日時以降のログのみをフィルタリング
    .with(true, async () => {
      const findLatestStartTime = performance.now();
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
      const findLatestEndTime = performance.now();
      logger.debug(
        `Filtering: Find latest logs took ${
          findLatestEndTime - findLatestStartTime
        } ms`,
      );

      // playerJoinDateResultからvalueを取得
      let latestPlayerJoinDate = null;
      if (latestPlayerJoinDateResult.isOk()) {
        latestPlayerJoinDate = latestPlayerJoinDateResult.value;
      }

      const filterStartTime = performance.now();
      const filtered = logInfoList.filter((log) => {
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
      const filterEndTime = performance.now();
      logger.debug(
        `Filtering: Actual filtering took ${
          filterEndTime - filterStartTime
        } ms`,
      );
      return filtered;
    })
    // すべてのログを読み込む
    .with(false, async () => logInfoList)
    .exhaustive();
  const filterLogsEndTime = performance.now();
  logger.debug(
    `Filtering logs took ${filterLogsEndTime - filterLogsStartTime} ms`,
  );

  const results: LogProcessingResults = {
    createdVRChatPhotoPathModelList: [],
    createdWorldJoinLogModelList: [],
    createdPlayerJoinLogModelList: [],
    createdPlayerLeaveLogModelList: [],
  };

  // 5. ログのバッチ処理
  const batchProcessStartTime = performance.now();
  const BATCH_SIZE = 1000;
  for (let i = 0; i < newLogs.length; i += BATCH_SIZE) {
    const batchStartTime = performance.now();
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

    const dbInsertStartTime = performance.now();
    const [worldJoinResults, playerJoinResults, playerLeaveResults] =
      await Promise.all([
        worldJoinLogService.createVRChatWorldJoinLogModel(worldJoinLogBatch),
        playerJoinLogService.createVRChatPlayerJoinLogModel(playerJoinLogBatch),
        playerLeaveLogService.createVRChatPlayerLeaveLogModel(
          playerLeaveLogBatch,
        ),
      ]);
    const dbInsertEndTime = performance.now();
    logger.debug(
      `Batch ${i / BATCH_SIZE + 1}: DB insert took ${
        dbInsertEndTime - dbInsertStartTime
      } ms`,
    );

    results.createdWorldJoinLogModelList =
      results.createdWorldJoinLogModelList.concat(worldJoinResults);
    results.createdPlayerJoinLogModelList =
      results.createdPlayerJoinLogModelList.concat(playerJoinResults);
    results.createdPlayerLeaveLogModelList =
      results.createdPlayerLeaveLogModelList.concat(playerLeaveResults);

    const batchEndTime = performance.now();
    logger.debug(
      `Batch ${i / BATCH_SIZE + 1} processing took ${
        batchEndTime - batchStartTime
      } ms`,
    );
  }
  const batchProcessEndTime = performance.now();
  logger.debug(
    `Total batch processing took ${
      batchProcessEndTime - batchProcessStartTime
    } ms`,
  );

  // 6. 写真のインデックス処理
  const photoIndexStartTime = performance.now();
  const latestPhotoDate = await match(excludeOldLogLoad)
    .with(true, async () => await vrchatPhotoService.getLatestPhotoDate())
    .with(false, () => null)
    .exhaustive();
  const photoResults =
    await vrchatPhotoService.createVRChatPhotoPathIndex(latestPhotoDate);
  results.createdVRChatPhotoPathModelList = photoResults;
  const photoIndexEndTime = performance.now();
  logger.debug(
    `Create photo path index took ${
      photoIndexEndTime - photoIndexStartTime
    } ms`,
  );

  const totalEndTime = performance.now();
  logger.info(
    `loadLogInfoIndexFromVRChatLog finished. Total time: ${
      totalEndTime - totalStartTime
    } ms`,
  );

  return neverthrow.ok(results);
}
