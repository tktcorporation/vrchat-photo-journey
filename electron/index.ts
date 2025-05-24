import path from 'node:path';
import { type BrowserWindow, app, ipcMain } from 'electron';

import { init as initSentry } from '@sentry/electron/main';
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

// Sentryの初期化
if (settingStore.getTermsAccepted()) {
  log.info('Sentry initializing in main process via electron/index.ts');
  initSentry({
    dsn: 'https://0c062396cbe896482888204f42f947ec@o4504163555213312.ingest.us.sentry.io/4508574659837952',
    environment: process.env.NODE_ENV,
    debug: process.env.NODE_ENV !== 'production',
  });
  log.info(
    'Sentry initialized in main process via electron/index.ts (early init, filtered default integrations using integration.name)',
  );
} else {
  log.info(
    'Sentry not initialized in main process (dev mode, terms not accepted or not production)',
  );
}

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

  // 設定の取得
  ipcMain.handle('get-setting', (_, key: string) => {
    switch (key) {
      case 'termsAccepted':
        return settingStore.getTermsAccepted();
      case 'termsVersion':
        return settingStore.getTermsVersion();
      default:
        return null;
    }
  });

  // 設定の保存
  ipcMain.handle('set-setting', (_, key: string, value: unknown) => {
    switch (key) {
      case 'termsAccepted':
        settingStore.setTermsAccepted(value as boolean);
        break;
      case 'termsVersion':
        settingStore.setTermsVersion(value as string);
        break;
    }
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
