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

const setVRChatPhotoDirByDialog = async (): Promise<neverthrow.Result<void, Error | 'canceled'>> => {
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    settingStore.setVRChatPhotoDir(dirPath);
    return undefined;
  });
};

const setVRChatLogFilesDirByDialog = async (): Promise<neverthrow.Result<void, Error | 'canceled'>> => {
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    settingStore.setLogFilesDir(dirPath);
    return undefined;
  });
};

const getVRChatPhotoItemDataListByYearMonth = (
  year: string,
  month: string
): neverthrow.Result<{ path: string; data: Buffer }[], Error | 'YEAR_MONTH_DIR_ENOENT' | 'PHOTO_DIR_READ_ERROR'> => {
  const result = vrchatPhotoService.getVRChatPhotoItemPathList(year, month);
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }
  const pathList = result.value;
  return vrchatPhotoService.getVRChatPhotoItemDataList(pathList);
};

const { getVRChatPhotoFolderYearMonthList } = vrchatPhotoService;

export {
  getVRChatPhotoFolderYearMonthList,
  setVRChatLogFilesDirByDialog,
  setVRChatPhotoDirByDialog,
  getConfigAndValidateAndCreateFiles,
  getVRChatLogFilesDir,
  getVRChatPhotoDir,
  clearAllStoredSettings,
  clearStoredSetting,
  openPathOnExplorer,
  getVRChatPhotoItemDataListByYearMonth
};
