import { IpcMainEvent, dialog } from 'electron';
import * as settingStore from './settingStore';
// 呼び出し元は service に集約したい
import * as service from './service';

const MESSAGE = {
  TOAST: 'toast',
  LOG_FILES_DIR: 'log-files-dir',
  STATUS_TO_USE_VRCHAT_LOG_FILES_DIR: 'status-to-use-vrchat-log-files-dir',
  STATUS_TO_USE_VRCHAT_PHOTO_DIR: 'status-to-use-vrchat-photo-dir',
  VRCHAT_PHOTO_DIR: 'vrchat-photo-dir',
  VRCHAT_PHOTO_DIR_WITH_ERROR: 'vrchat-photo-dir-with-error',
  LOG_FILES_DIR_WITH_ERROR: 'log-files-dir-with-error'
};

const messages = {
  PATH_NOT_SET: 'Path is not set',
  LOG_PATH_SET: (path: string) => `Log file path set to ${path}`
};

export const handleClearAllStoredSettings = () => {
  settingStore.clearAllStoredSettings();
};

export const handleOpenDialogAndSetLogFilesDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setLogFilesDir(dirPath);
        event.sender.send(MESSAGE.TOAST, messages.LOG_PATH_SET(dirPath));
        event.sender.send(MESSAGE.LOG_FILES_DIR, dirPath);
      }
    })
    .catch((err) => {
      console.log(err);
      event.sender.send(MESSAGE.TOAST, err.message);
    });
};

export const handleGetLogFilesDir = (event: IpcMainEvent) => {
  const logFilesDir = service.getVRChatLogFilesDir();
  event.sender.send(MESSAGE.LOG_FILES_DIR, logFilesDir.storedPath);
  event.sender.send(MESSAGE.LOG_FILES_DIR_WITH_ERROR, {
    storedPath: logFilesDir.storedPath,
    path: logFilesDir.path,
    error: logFilesDir.error
  });
};

export const handlegetStatusToUseVRChatLogFilesDir = (event: IpcMainEvent) => {
  const vrchatLogFilesDir = service.getVRChatLogFilesDir();
  let status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' | 'logFileDirNotFound' = 'ready';
  if (vrchatLogFilesDir.path === null) {
    status = 'logFilesDirNotSet';
  } else if (vrchatLogFilesDir.error !== null) {
    status = vrchatLogFilesDir.error;
  }
  event.sender.send(MESSAGE.STATUS_TO_USE_VRCHAT_LOG_FILES_DIR, status);
};

export const handleOpenDialogAndSetVRChatPhotoDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setVRChatPhotoDir(dirPath);
        event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR, dirPath);
        event.sender.send(MESSAGE.TOAST, `VRChat photo path set to ${dirPath}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export const handleGetVRChatPhotoDir = (event: IpcMainEvent) => {
  const vrchatPhotoDir = service.getVRChatPhotoDir();
  event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR, vrchatPhotoDir.storedPath);
  event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR_WITH_ERROR, {
    storedPath: vrchatPhotoDir.storedPath,
    path: vrchatPhotoDir.path,
    error: vrchatPhotoDir.error
  });
};

export const handleCreateFiles = (event: IpcMainEvent) => {
  // get log lines
  const logFilesDir = service.getVRChatLogFilesDir();
  if (typeof logFilesDir.path !== 'string') {
    event.sender.send('toast', `Log file path is not set`);
    return;
  }
  if (logFilesDir.error !== null) {
    switch (logFilesDir.error) {
      case 'logFilesNotFound':
        event.sender.send('toast', `Log files not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${logFilesDir.error}`);
        break;
    }
    return;
  }
  const convertWorldJoinLogInfoListResult = service.convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    switch (convertWorldJoinLogInfoListResult.error.code) {
      case 'LOG_FILE_NOT_FOUND':
        event.sender.send('toast', `Log file not found`);
        break;
      case 'LOG_FILE_DIR_NOT_FOUND':
        event.sender.send('toast', `Log file dir not found`);
        break;
      case 'LOG_FILES_NOT_FOUND':
        event.sender.send('toast', `Log files not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${convertWorldJoinLogInfoListResult.error.code}`);
        break;
    }
    return;
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = service.getVRChatPhotoDir();
  if (typeof vrchatPhotoDir.storedPath !== 'string') {
    event.sender.send('toast', `VRChat photo path is not set`);
    return;
  }
  if (vrchatPhotoDir.error !== null) {
    switch (vrchatPhotoDir.error) {
      case 'photoYearMonthDirsNotFound':
        event.sender.send('toast', `Photo year-month dirs not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${vrchatPhotoDir.error}`);
        break;
    }
    return;
  }

  try {
    service.createFiles(vrchatPhotoDir.storedPath, convertWorldJoinLogInfoList);
    event.sender.send('toast', `Files created`);
  } catch (error) {
    console.log(error);
    event.sender.send('toast', `Error: ${error}`);
  }
};
