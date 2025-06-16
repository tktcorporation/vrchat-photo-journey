import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import type {
  VRChatLogFilePath,
  VRChatLogFilesDirPath,
} from '../vrchatLogFileDir/model';
import * as vrchatLogFileDirService from '../vrchatLogFileDir/service';
import { VRChatLogFileError } from './error';
import type { VRChatLogStoreFilePath } from './model';

// パーサー機能のインポート
import {
  type VRChatPlayerJoinLog,
  type VRChatPlayerLeaveLog,
  type VRChatWorldJoinLog,
  type VRChatWorldLeaveLog,
  convertLogLinesToWorldAndPlayerJoinLogInfos,
  extractPlayerJoinInfoFromLog,
  filterLogLinesByDate,
} from './parsers';
// TODO: アプリイベントの型は今後実装
// import type {
//   VRChatAppExitLog,
//   VRChatAppStartLog,
// } from './parsers/appEventParser';

// ファイルハンドラー機能のインポート
import {
  appendLoglinesToFile,
  getLegacyLogStoreFilePath,
  getLogLinesByLogFilePathList,
  getLogStoreFilePathForDate,
  getLogStoreFilePathsInRange,
  importLogLinesFromLogPhotoDirPath,
} from './fileHandlers';

/**
 * VRChatログサービスのメインインターフェース
 * ログファイルの処理と情報抽出を提供
 */

/**
 * 指定されたログディレクトリからVRChatログ情報を取得
 * @param logFilesDir VRChatログファイルのディレクトリパス
 * @returns ワールド参加・プレイヤー参加/退出ログの配列
 */
export const getVRChaLogInfoFromLogPath = async (
  logFilesDir: VRChatLogFilesDirPath,
): Promise<
  neverthrow.Result<
    (
      | VRChatWorldJoinLog
      | VRChatWorldLeaveLog
      | VRChatPlayerJoinLog
      | VRChatPlayerLeaveLog
    )[],
    // TODO: アプリイベントの型は今後実装
    // | VRChatAppStartLog
    // | VRChatAppExitLog
    VRChatLogFileError
  >
> => {
  const logFilePathList =
    await vrchatLogFileDirService.getVRChatLogFilePathList(logFilesDir);

  if (logFilePathList.isErr()) {
    return neverthrow.err(
      match(logFilePathList.error)
        .with('ENOENT', () => new VRChatLogFileError('LOG_FILE_DIR_NOT_FOUND'))
        .exhaustive(),
    );
  }

  const logInfoList = await getVRChaLogInfoByLogFilePathList(
    logFilePathList.value,
  );

  if (logInfoList.isErr()) {
    return neverthrow.err(logInfoList.error);
  }

  return neverthrow.ok(logInfoList.value);
};

/**
 * ログファイルパスのリストからVRChatログ情報を取得
 * @param logFilePathList ログファイルパスの配列
 * @returns ワールド参加・プレイヤー参加/退出ログの配列
 */
export const getVRChaLogInfoByLogFilePathList = async (
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[],
): Promise<
  neverthrow.Result<
    (
      | VRChatWorldJoinLog
      | VRChatWorldLeaveLog
      | VRChatPlayerJoinLog
      | VRChatPlayerLeaveLog
    )[],
    // TODO: アプリイベントの型は今後実装
    // | VRChatAppStartLog
    // | VRChatAppExitLog
    VRChatLogFileError
  >
> => {
  const logLineList = await getLogLinesByLogFilePathList({
    logFilePathList,
    includesList: [
      'VRC Analytics Initialized', // TODO: 今後実装
      '[Behaviour] Joining ',
      '[Behaviour] OnPlayerJoined ',
      '[Behaviour] OnPlayerLeft ',
      'VRCApplication: HandleApplicationQuit', // worldLeaveParserで処理
    ],
  });

  if (logLineList.isErr()) {
    return neverthrow.err(logLineList.error);
  }

  const logInfoList = convertLogLinesToWorldAndPlayerJoinLogInfos(
    logLineList.value,
  );

  return neverthrow.ok(logInfoList);
};

// ファイルハンドラー機能の再エクスポート
export {
  getLogLinesByLogFilePathList,
  getLogStoreFilePathForDate,
  getLegacyLogStoreFilePath,
  getLogStoreFilePathsInRange,
  appendLoglinesToFile,
  importLogLinesFromLogPhotoDirPath,
};

// 型定義の再エクスポート
export type {
  VRChatWorldJoinLog,
  VRChatWorldLeaveLog,
  VRChatPlayerJoinLog,
  VRChatPlayerLeaveLog,
  // TODO: アプリイベントの型は今後実装
  // VRChatAppStartLog,
  // VRChatAppExitLog,
};

// パーサー機能の再エクスポート
export { extractPlayerJoinInfoFromLog, filterLogLinesByDate };
