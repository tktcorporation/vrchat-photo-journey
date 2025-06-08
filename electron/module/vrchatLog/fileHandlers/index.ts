/**
 * VRChatログのファイル操作機能をまとめたモジュール
 */

// ログファイル読み込み
export {
  getLogLinesFromLogFile,
  getLogLinesByLogFilePathList,
} from './logFileReader';

// ログストレージ管理
export {
  getLogStoreDir,
  initLogStoreDir,
  getLogStoreFilePathForDate,
  getLegacyLogStoreFilePath,
  getLogStoreFilePathsInRange,
  appendLoglinesToFile,
} from './logStorageManager';

// 写真からのログインポート
export { importLogLinesFromLogPhotoDirPath } from './photoLogImporter';
