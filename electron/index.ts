import path from 'node:path';
import { init } from '@sentry/electron/main';
import { type BrowserWindow, app, ipcMain } from 'electron';

// 本番環境でのみSentryを初期化
if (app?.isPackaged) {
  init({
    dsn: 'https://0c062396cbe896482888204f42f947ec@o4504163555213312.ingest.us.sentry.io/4508574659837952',
    debug: process.env.NODE_ENV === 'development',
  });
}

// Packages
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
    log.error({
      message,
    });
  });
};

const backgroundUsecase = getBackgroundUsecase(settingStore);

const createOrGetMainWindow = async (): Promise<BrowserWindow> => {
  const mainWindow = electronUtil.createOrGetWindow();
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
  electronUtil.setTray();

  unhandled({
    logger: (error) => log.error({ message: error }),
  });
};

app
  .whenReady()
  .then(initializeApp)
  .catch((error) => log.error({ message: error }));

process.on('uncaughtException', (error) => log.error({ message: error }));
process.on('unhandledRejection', (error) => log.error({ message: error }));

app.on('second-instance', () => {
  const mainWindow = electronUtil.createOrGetWindow();
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
