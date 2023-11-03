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
