import * as neverthrow from 'neverthrow';

import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import * as vrchatPhotoService from './service/vrchatPhoto/service';
import * as infoFileService from './service/infoFile/service';
import VRChatLogFileError from './service/vrchatLog/error';
import * as settingStore from './settingStore';
import * as utilsService from './service/utilsService';

const getVRChatLogFilesDir = (): {
  storedPath: string | null;
  path: string;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
} => {
  return vrchatLogService.getVRChatLogFileDir();
};

const getVRChatPhotoDir = () => {
  return vrchatPhotoService.getVRChatPhotoDir();
};

const convertLogLinesToWorldJoinLogInfosByVRChatLogDir = (
  logDir: string
): neverthrow.Result<vrchatLogService.WorldJoinLogInfo[], VRChatLogFileError> => {
  const result = vrchatLogService.getLogLinesFromDir(logDir);
  return result.map((logLines) => vrchatLogService.convertLogLinesToWorldJoinLogInfos(logLines));
};

const createFiles = (vrchatPhotoDir: string, worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[]) => {
  return infoFileService.createFiles(vrchatPhotoDir, worldJoinLogInfoList);
};

const getConfigAndValidateAndCreateFiles = (): neverthrow.Result<void, string> => {
  const logFilesDir = getVRChatLogFilesDir();
  if (logFilesDir.error !== null) {
    return neverthrow.err(`${logFilesDir.error}`);
  }
  const convertWorldJoinLogInfoListResult = convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    return neverthrow.err(`${convertWorldJoinLogInfoListResult.error.code}`);
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = getVRChatPhotoDir();
  if (vrchatPhotoDir.error !== null) {
    return neverthrow.err(vrchatPhotoDir.error);
  }

  const result = createFiles(vrchatPhotoDir.path, convertWorldJoinLogInfoList);
  return result
    .map(() => {
      return undefined;
    })
    .mapErr((error) => {
      return `${error.type}: ${error.error}`;
    });
};

const clearAllStoredSettings = () => {
  settingStore.clearAllStoredSettings();
};
const clearStoredSetting = (key: Parameters<typeof settingStore.clearStoredSetting>[0]) => {
  return settingStore.clearStoredSetting(key);
};

const openPathOnExplorer = (path: string) => {
  return utilsService.openPathInExplorer(path);
};

export {
  getConfigAndValidateAndCreateFiles,
  getVRChatLogFilesDir,
  getVRChatPhotoDir,
  clearAllStoredSettings,
  clearStoredSetting,
  openPathOnExplorer
};
