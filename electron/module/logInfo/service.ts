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
  let startDate: Date;
  const logStoreFilePaths: VRChatLogStoreFilePath[] = [];

  if (excludeOldLogLoad) {
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

    // 最新の日付を取得、なければ1年前
    startDate = dates.at(-1) ?? datefns.subYears(new Date(), 1);
  } else {
    // すべてのログを読み込む場合は、非常に古い日付から
    startDate = datefns.parseISO('2000-01-01');
    // 旧形式のログファイルも追加
    const legacyLogStoreFilePath =
      await vrchatLogService.getLegacyLogStoreFilePath();
    if (legacyLogStoreFilePath) {
      logStoreFilePaths.push(legacyLogStoreFilePath);
    }
  }

  // 日付範囲内のすべてのログファイルパスを取得して追加
  const pathsInRange = await vrchatLogService.getLogStoreFilePathsInRange(
    startDate,
    new Date(),
  );
  logStoreFilePaths.push(...pathsInRange);

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
  // 旧Appの形式のログファイル(写真)からログ情報を保存
  // 写真フォルダが存在しない場合はスキップ（正常系）
  const vrChatPhotoDirPath = await vrchatPhotoService.getVRChatPhotoDirPath();
  if (vrChatPhotoDirPath) {
    await vrchatLogService.importLogLinesFromLogPhotoDirPath({
      vrChatPhotoDirPath,
    });
  }

  // 処理対象となるログファイルパスを取得
  const logStoreFilePaths = await _getLogStoreFilePaths(excludeOldLogLoad);
  logger.info(
    `loadLogInfoIndexFromVRChatLog target: ${logStoreFilePaths.map(
      (path) => path.value,
    )}`,
  );

  // ログファイルからログ情報を取得
  const logInfoListFromLogFile =
    await vrchatLogService.getVRChaLogInfoByLogFilePathList(logStoreFilePaths);
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
      let latestPlayerJoinDate = null;
      if (latestPlayerJoinDateResult.isOk()) {
        latestPlayerJoinDate = latestPlayerJoinDateResult.value;
      }

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
  const BATCH_SIZE = 1000;
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
}
