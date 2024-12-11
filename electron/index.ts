import path from 'node:path';
// Packages
import { type BrowserWindow, app, ipcMain } from 'electron';
import { createIPCHandler } from 'electron-trpc/main';
import unhandled from 'electron-unhandled';
import { router } from './api';
import * as electronUtil from './electronUtil';
import * as log from './lib/logger';
import * as sequelizeClient from './lib/sequelize';
import { getAppUserDataPath } from './lib/wrappedApp';
import { getBackgroundUsecase } from './module/backGroundUsecase';
import { initSettingStore } from './module/settingStore';

const settingStore = initSettingStore('v0-settings');

const CHANNELS = {
  ERROR_MESSAGE: 'error-message',
  TOAST: 'toast',
};

const registerIpcMainListeners = () => {
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
