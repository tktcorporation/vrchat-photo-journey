// Native
import { join } from 'node:path';

import EventEmitter from 'node:events';
// Packages
import {
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  app,
  ipcMain,
  shell,
} from 'electron';
import type { Event } from 'electron';
import isDev from 'electron-is-dev';
import * as log from 'electron-log';
import { createIPCHandler } from 'electron-trpc/main';
import { router } from './api';
import * as joinLogInfoFileService from './module/joinLogInfoFile/service';

const height = 600;
const width = 800;

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    backgroundColor: '#fff',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  createIPCHandler({ router, windows: [mainWindow] });
  const port = process.env.PORT || 3000;
  const url = isDev
    ? `http://localhost:${port}`
    : join(__dirname, '../src/out/index.html');

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(url);
  }
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // http or httpsのリンクをクリックしたときにデフォルトブラウザで開く
  const handleUrlOpen = (e: Event, url: string) => {
    if (url.match(/^http/)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  };
  mainWindow.webContents.on('will-navigate', handleUrlOpen);

  // For AppBar
  ipcMain.on('minimize', () => {
    mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
  });

  ipcMain.on('close', () => {
    mainWindow.close();
  });

  return mainWindow;
}

const setTray = (mainWindow: BrowserWindow) => {
  const appPath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const fontfile = join(appPath, 'assets', 'icons', 'Icon-Electron.png');
  const tray = new Tray(fontfile);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ウィンドウを開く',
      click: () => {
        createWindow();
      },
    },
    {
      label: '終了',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip(app.name);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
};
import type { getSettingStore } from './module/settingStore';
const setTimeEventEmitter = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  // 6時間ごとに通知を出す
  const intervalEventEmitter = new EventEmitter();
  setInterval(
    () => {
      intervalEventEmitter.emit('time', new Date());
    },
    1000 * 60 * 60 * 6,
    // 1000 * 20
  );

  intervalEventEmitter.on('time', async (now: Date) => {
    if (!settingStore.getBackgroundFileCreateFlag()) {
      log.info(`backgroundFileCreateFlag is false: ${now.toString()}`);
      return;
    }
    const result =
      await joinLogInfoFileService.getConfigAndValidateAndCreateFiles(
        settingStore,
      )();

    let notificationTitle = '';
    let notificationBody = '';

    if (result.isErr()) {
      log.error(result.error);
      notificationTitle = 'エラーが発生しました。';
      notificationBody = result.error;
    } else {
      log.info(result.value);
      notificationTitle = 'joinの記録に成功しました';
      notificationBody = JSON.stringify(result.value);
    }

    const notification = new Notification({
      title: notificationTitle,
      body: `${notificationBody}: ${now.toString()}`,
    });
    notification.show();
  });
};

export { setTray, createWindow, setTimeEventEmitter };
