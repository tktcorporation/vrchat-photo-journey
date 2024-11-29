import path from 'node:path';
// Packages
import { type BrowserWindow, app, ipcMain } from 'electron';
import { createIPCHandler } from 'electron-trpc/main';
import unhandled from 'electron-unhandled';
import { router } from './api';
import * as electronUtil from './electronUtil';
import * as log from './lib/logger';
// import { initRDBClient } from './module/logInfo/model';
import * as sequelizeClient from './lib/sequelize';
import { getAppUserDataPath } from './lib/wrappedApp';
import { getBackgroundUsecase } from './module/backGroundUsecase';
import { getController } from './module/controller';
import { initSettingStore } from './module/settingStore';

const settingStore = initSettingStore('v0-settings');
const controller = getController(settingStore);

const CHANNELS = {
  CLEAR_ALL_STORED_SETTINGS: 'clear-all-stored-settings',
  OPEN_DIALOG_AND_SET_LOG_FILES_DIR: 'open-dialog-and-set-log-files-dir',
  GET_LOG_FILES_DIR: 'get-log-files-dir',
  GET_JOIN_WORLD_LOG_LINES: 'get-join-world-log-lines',
  OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR: 'open-dialog-and-set-vrchat-photo-dir',
  GET_VRCHAT_PHOTO_DIR: 'get-vrchat-photo-dir',
  CREATE_FILES: 'create-files',
  ERROR_MESSAGE: 'error-message',
  TOAST: 'toast',
  LOG_FILES_DIR: 'log-files-dir',
  LOG_FILES_DIR_WITH_ERROR: 'log-files-dir-with-error',
  JOIN_WORLD_LOG_LINES: 'join-world-log-lines',
  GET_STATUS_TO_USE_VRCHAT_LOG_FILES_DIR:
    'get-status-to-use-vrchat-log-files-dir',
  GET_STATUS_TO_USE_VRCHAT_PHOTO_DIR: 'get-status-to-use-vrchat-photo-dir',
};

const registerIpcMainListeners = () => {
  ipcMain.on(
    CHANNELS.OPEN_DIALOG_AND_SET_LOG_FILES_DIR,
    controller.handleOpenDialogAndSetLogFilesDir,
  );
  ipcMain.on(
    CHANNELS.OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR,
    controller.handleOpenDialogAndSetVRChatPhotoDir,
  );
  ipcMain.on(CHANNELS.ERROR_MESSAGE, (_, message) => {
    log.error(message);
  });
};

const backgroundUsecase = getBackgroundUsecase(settingStore);

const createOrGetMainWindow = async (): Promise<BrowserWindow> => {
  const mainWindow = electronUtil.createOrGetWindow(settingStore);
  // 他のウィンドウ設定やイベントリスナーをここに追加
  return mainWindow;
};

const initializeRDBClient = async () => {
  const filePath = path
    .join(getAppUserDataPath(), 'db.sqlite')
    .split(path.sep)
    .join(path.posix.sep);
  sequelizeClient.initRDBClient({
    db_url: filePath,
  });
  await sequelizeClient.syncRDBClient();
};

const initializeApp = async () => {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  await initializeRDBClient();
  registerIpcMainListeners();
  const mainWindow = await createOrGetMainWindow();
  createIPCHandler({ router, windows: [mainWindow] });
  electronUtil.setTray(settingStore);

  unhandled({
    logger: (error) => log.error(error),
  });
};

app
  .whenReady()
  .then(initializeApp)
  .catch((error) => log.error(error));

process.on('uncaughtException', (error) => log.error(error));
process.on('unhandledRejection', (error) => log.error(error));

app.on('second-instance', () => {
  const mainWindow = electronUtil.createOrGetWindow(settingStore);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on('activate', async () => {
  const mainWindow = await createOrGetMainWindow();
  mainWindow.show();
  mainWindow.focus();
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    return;
  }
  // background処理が有効になっている場合は終了しない
  if (backgroundUsecase.getIsEnabledBackgroundProcess()) {
    electronUtil.setTimeEventEmitter(settingStore);
    return;
  }
  app.quit();
});
