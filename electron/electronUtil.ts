// Native
import { join } from 'node:path';

import EventEmitter from 'node:events';
// Packages
import {
  BrowserWindow,
  Menu,
  // Notification,
  Tray,
  app,
  ipcMain,
  screen,
  shell,
} from 'electron';
import type { Event } from 'electron';
import isDev from 'electron-is-dev';
import * as log from './lib/logger';
// import * as joinLogInfoFileService from './module/joinLogInfoFile/service';

const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1024,
  DEFAULT_HEIGHT: 768,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
} as const;

function createWindow(
  settingStore: ReturnType<typeof getSettingStore>,
): BrowserWindow {
  const savedBounds = settingStore.getWindowBounds();

  // 保存された位置に最も近いディスプレイを取得
  const nearestDisplay = savedBounds
    ? screen.getDisplayNearestPoint({ x: savedBounds.x, y: savedBounds.y })
    : screen.getPrimaryDisplay();

  const workAreaSize = nearestDisplay.workArea;

  // ウィンドウサイズを画面サイズに合わせて調整
  const width = Math.min(
    savedBounds?.width || WINDOW_CONFIG.DEFAULT_WIDTH,
    workAreaSize.width,
  );
  const height = Math.min(
    savedBounds?.height || WINDOW_CONFIG.DEFAULT_HEIGHT,
    workAreaSize.height,
  );

  // ウィンドウ位置が画面外にはみ出していないか確認
  const x =
    savedBounds?.x !== undefined
      ? Math.max(0, Math.min(savedBounds.x, workAreaSize.width - width))
      : undefined;
  const y =
    savedBounds?.y !== undefined
      ? Math.max(0, Math.min(savedBounds.y, workAreaSize.height - height))
      : undefined;

  const mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    //  change to false to use AppBar
    frame: true,
    show: true,
    fullscreenable: true,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false, // セキュリティのため明示的に無効化
      contextIsolation: true, // セキュリティのため明示的に有効化
    },
  });

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
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return;
    }
    win.isMinimized() ? win.restore() : win.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return;
    }
    win.isMaximized() ? win.restore() : win.maximize();
  });

  ipcMain.on('close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return;
    }
    win.close();
  });

  // ウィンドウの状態を保存
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    settingStore.setWindowBounds(bounds);
  });

  // ディスプレイ構成が変更された時のハンドリング
  screen.on('display-metrics-changed', () => {
    const currentBounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayNearestPoint({
      x: currentBounds.x,
      y: currentBounds.y,
    });

    // ウィンドウが表示可能な領域に収まるように調整
    const adjustedBounds = {
      width: Math.min(currentBounds.width, currentDisplay.workAreaSize.width),
      height: Math.min(
        currentBounds.height,
        currentDisplay.workAreaSize.height,
      ),
      x: Math.max(
        0,
        Math.min(
          currentBounds.x,
          currentDisplay.workAreaSize.width - currentBounds.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          currentBounds.y,
          currentDisplay.workAreaSize.height - currentBounds.height,
        ),
      ),
    };

    mainWindow.setBounds(adjustedBounds);
  });

  return mainWindow;
}

let mainWindow: BrowserWindow | null = null;
// FIXME: このexport はやめたい
export const getWindow = (): BrowserWindow | null => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    mainWindow = windows[0];
    return mainWindow;
  }
  return null;
};
/**
 * window が存在しなければ新しく作成する
 * 存在していれば取得する
 */
const createOrGetWindow = (
  settingStore: ReturnType<typeof getSettingStore>,
): BrowserWindow => {
  const window = getWindow();
  if (window) {
    return window;
  }
  mainWindow = createWindow(settingStore);
  return mainWindow;
};

const setTray = (settingStore: ReturnType<typeof getSettingStore>) => {
  let tray: Tray | null = null;

  const createTray = () => {
    if (tray !== null) return;

    const appPath = app.isPackaged ? process.resourcesPath : app.getAppPath();
    const iconPath = join(appPath, 'assets', 'icons', 'Icon-Electron.png');

    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'ウィンドウを表示',
        click: () => {
          const window = createOrGetWindow(settingStore);
          if (window.isMinimized()) window.restore();
          window.show();
          window.focus();
        },
      },
      { type: 'separator' },
      {
        label: '設定',
        click: () => {
          /* 設定画面を開く */
        },
      },
      { type: 'separator' },
      {
        label: '終了',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip(app.name);
    tray.setContextMenu(contextMenu);
  };

  // アプリ終了時にトレイも破棄
  app.on('before-quit', () => {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

  return createTray();
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
    // const result =
    //   await joinLogInfoFileService.getConfigAndValidateAndCreateFiles(
    //     settingStore,
    //   )();

    // let notificationTitle = '';
    // let notificationBody = '';

    // if (result.isErr()) {
    //   log.error(result.error);
    //   notificationTitle = 'エラーが発生しました。';
    //   notificationBody = result.error;
    // } else {
    //   log.info(result.value);
    //   if (result.value.createdFilesLength === 0) {
    //     return;
    //   }
    //   notificationTitle = 'joinの記録に成功しました';
    //   notificationBody = JSON.stringify(result.value);
    // }

    // const notification = new Notification({
    //   title: notificationTitle,
    //   body: `${notificationBody}: ${now.toString()}`,
    // });
    // notification.show();
  });
};

export { setTray, createOrGetWindow, setTimeEventEmitter };
