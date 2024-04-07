import type * as neverthrow from 'neverthrow';

import path from 'node:path';
import * as datefns from 'date-fns';
import * as log from 'electron-log';
import { P, match } from 'ts-pattern';
// import * as infoFileService from './joinLogInfoFile/service';
// import { getToCreateWorldJoinLogInfos } from './joinLogInfoFile/service';
// import { YearMonthPathNotFoundError } from './service/error';
// import { PhotoFileNameSchema, parsePhotoFileName } from './service/type';
import * as utilsService from './electronUtil/service';
// import type VRChatPhotoFileError from './service/vrchatPhoto/error';
// import * as vrchatPhotoService from './service/vrchatPhoto/service';
import type { getSettingStore } from './settingStore';
import { VRChatLogFilesDirPathSchema } from './vrchatLogFileDir/model';
// import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import * as vrchatLogFileDirService from './vrchatLogFileDir/service';
// import type VRChatLogFileError from './vrchatLog/error';

const getVRChatLogFilesDir =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  (): {
    storedPath: string | null;
    path: string;
    error: null | 'logFilesNotFound' | 'logFileDirNotFound';
  } => {
    const storedLogFilesDirPath = match(settingStore.getLogFilesDir())
      .with(null, () => {
        return null;
      })
      .with(P.string, (path) => {
        return VRChatLogFilesDirPathSchema.parse(path);
      })
      .exhaustive();
    return vrchatLogFileDirService.getVRChatLogFileDir({
      storedLogFilesDirPath: storedLogFilesDirPath,
    });
  };

const clearAllStoredSettings =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    settingStore.clearAllStoredSettings();
  };
const clearStoredSetting =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  (
    key: Parameters<
      ReturnType<typeof getSettingStore>['clearStoredSetting']
    >[0],
  ) => {
    return settingStore.clearStoredSetting(key);
  };

const openPathOnExplorer = (filePath: string) => {
  log.debug(`openPathOnExplorer ${filePath}`);
  return utilsService.openPathInExplorer(filePath);
};

const openElectronLogOnExplorer = async () => {
  const electronLogPath = log.transports.file.getFile().path;
  log.debug(`electronLogPath ${electronLogPath}`);
  return utilsService.openPathInExplorer(electronLogPath);
};

const openDirOnExplorer = (dirPath: string) => {
  const dir = path.dirname(dirPath);
  return utilsService.openPathInExplorer(dir);
};

const setVRChatLogFilesDirByDialog =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<neverthrow.Result<void, Error | 'canceled'>> => {
    return (await utilsService.openGetDirDialog()).map((dirPath) => {
      settingStore.setLogFilesDir(dirPath);
      return undefined;
    });
  };

const getService = (settingStore: ReturnType<typeof getSettingStore>) => {
  return {
    getVRChatLogFilesDir: getVRChatLogFilesDir(settingStore),
    clearAllStoredSettings: clearAllStoredSettings(settingStore),
    clearStoredSetting: clearStoredSetting(settingStore),
    openPathOnExplorer,
    openElectronLogOnExplorer,
    openDirOnExplorer,
    setVRChatLogFilesDirByDialog: setVRChatLogFilesDirByDialog(settingStore),
  };
};

export { getService };
