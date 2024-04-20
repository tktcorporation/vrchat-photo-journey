import type * as neverthrow from 'neverthrow';

import path from 'node:path';
import * as log from 'electron-log';
// import * as infoFileService from './joinLogInfoFile/service';
// import { getToCreateWorldJoinLogInfos } from './joinLogInfoFile/service';
// import { YearMonthPathNotFoundError } from './service/error';
// import { PhotoFileNameSchema, parsePhotoFileName } from './service/type';
import * as utilsService from './electronUtil/service';
// import type VRChatPhotoFileError from './service/vrchatPhoto/error';
// import * as vrchatPhotoService from './service/vrchatPhoto/service';
import { getSettingStore } from './settingStore';
// import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import * as vrchatLogFileDirService from './vrchatLogFileDir/service';
// import type VRChatLogFileError from './vrchatLog/error';

export const getVRChatLogFilesDir = async (): Promise<{
  storedPath: string | null;
  path: string;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
}> => {
  const result = await vrchatLogFileDirService.getVRChatLogFileDir();
  return {
    storedPath: result.storedPath?.value ?? null,
    path: result.path.value,
    error: result.error,
  };
};

export const clearAllStoredSettings = () => {
  const settingStore = getSettingStore();
  return settingStore.clearAllStoredSettings();
};
export const clearStoredSetting = (
  key: Parameters<ReturnType<typeof getSettingStore>['clearStoredSetting']>[0],
) => {
  const settingStore = getSettingStore();
  return settingStore.clearStoredSetting(key);
};

export const openPathOnExplorer = (filePath: string) => {
  log.debug(`openPathOnExplorer ${filePath}`);
  return utilsService.openPathInExplorer(filePath);
};

export const openElectronLogOnExplorer = async () => {
  const electronLogPath = log.transports.file.getFile().path;
  log.debug(`electronLogPath ${electronLogPath}`);
  return utilsService.openPathInExplorer(electronLogPath);
};

export const openDirOnExplorer = (dirPath: string) => {
  const dir = path.dirname(dirPath);
  return utilsService.openPathInExplorer(dir);
};

export const setVRChatLogFilesDirByDialog = async (): Promise<
  neverthrow.Result<void, Error | 'canceled'>
> => {
  const settingStore = getSettingStore();
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    settingStore.setLogFilesDir(dirPath);
    return undefined;
  });
};
