// Native
import EventEmitter from 'node:events';
import { join } from 'node:path';

// Packages
import {
  BrowserWindow,
  type Event,
  Menu,
  Notification,
  Tray,
  app,
  ipcMain,
  shell,
} from 'electron';
import isDev from 'electron-is-dev';

// Local
import * as log from './lib/logger';

const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1024,
  DEFAULT_HEIGHT: 768,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
} as const;

function createWindow(): BrowserWindow {
  const savedBounds = null; //settingStore.getWindowBounds();

  const { width, height } = savedBounds || {
    width: WINDOW_CONFIG.DEFAULT_WIDTH,
    height: WINDOW_CONFIG.DEFAULT_HEIGHT,
  };

  // 保存された位置に最も近いディスプレイを取得
  // const nearestDisplay = savedBounds
  //   ? screen.getDisplayNearestPoint({ x: savedBounds.x, y: savedBounds.y })
  //   : screen.getPrimaryDisplay();

  // const workAreaSize = nearestDisplay.workArea;

  // ウィンドウサイズを画面サイズに合わせて調整
  // const width = Math.min(
  //   savedBounds?.width || WINDOW_CONFIG.DEFAULT_WIDTH,
  //   workAreaSize.width,
  // );
  // const height = Math.min(
  //   savedBounds?.height || WINDOW_CONFIG.DEFAULT_HEIGHT,
  //   workAreaSize.height,
  // );

  // ウィンドウ位置が画面外にはみ出していないか確認
  // const x =
  //   savedBounds?.x !== undefined
  //     ? Math.max(0, Math.min(savedBounds.x, workAreaSize.width - width))
  //     : undefined;
  // const y =
  //   savedBounds?.y !== undefined
  //     ? Math.max(0, Math.min(savedBounds.y, workAreaSize.height - height))
  //     : undefined;

  const mainWindow = new BrowserWindow({
    width,
    height,
    // x,
    // y,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    //  change to false to use AppBar
    frame: true,
    show: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false, // セキュリティのため明示的に無効化
      contextIsolation: true, // セキュリティのため明示的に有効化
    },
  });

  // 開発環境の場合、DevToolsを開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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

  // デバッグのために常にDevToolsを開く
  mainWindow.webContents.openDevTools();

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
    // const bounds = mainWindow.getBounds();
    // settingStore.setWindowBounds(bounds);
  });

  // ディスプレイ構成が変更された時のハンドリング
  // screen.on('display-metrics-changed', () => {
  //   const currentBounds = mainWindow.getBounds();
  //   const currentDisplay = screen.getDisplayNearestPoint({
  //     x: currentBounds.x,
  //     y: currentBounds.y,
  //   });

  //   // ウィンドウが表示可能な領域に収まるように調整
  //   const adjustedBounds = {
  //     width: Math.min(currentBounds.width, currentDisplay.workAreaSize.width),
  //     height: Math.min(
  //       currentBounds.height,
  //       currentDisplay.workAreaSize.height,
  //     ),
  //     x: Math.max(
  //       0,
  //       Math.min(
  //         currentBounds.x,
  //         currentDisplay.workAreaSize.width - currentBounds.width,
  //       ),
  //     ),
  //     y: Math.max(
  //       0,
  //       Math.min(
  //         currentBounds.y,
  //         currentDisplay.workAreaSize.height - currentBounds.height,
  //       ),
  //     ),
  //   };

  //   mainWindow.setBounds(adjustedBounds);
  // });

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
const createOrGetWindow = (): BrowserWindow => {
  const window = getWindow();
  if (window) {
    return window;
  }
  mainWindow = createWindow();
  return mainWindow;
};

const setTray = () => {
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
          const window = createOrGetWindow();
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
        label: 'エラーログを開く',
        click: () => {
          const logPath = app.getPath('logs');
          shell.openPath(logPath);
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
import { match } from 'ts-pattern';
import { loadLogInfoIndexFromVRChatLog } from './module/logInfo/service';
import type { getSettingStore } from './module/settingStore';
const setTimeEventEmitter = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  const intervalEventEmitter = new EventEmitter();
  // 6時間ごとに実行
  setInterval(
    () => {
      intervalEventEmitter.emit('time', new Date());
    },
    1000 * 60 * 60 * 6,
  );

  intervalEventEmitter.on('time', async (now: Date) => {
    if (!settingStore.getBackgroundFileCreateFlag()) {
      log.debug('バックグラウンド処理が無効になっています');
      return;
    }

    const result = await loadLogInfoIndexFromVRChatLog();

    if (result.isErr()) {
      const error = result.error;
      const errorMessage = match(error)
        .with(
          { code: 'LOG_FILE_NOT_FOUND' },
          () => 'VRChatのログファイルが見つかりませんでした',
        )
        .with(
          { code: 'LOG_FILE_DIR_NOT_FOUND' },
          () => 'VRChatのログディレクトリが見つかりませんでした',
        )
        .with(
          { code: 'LOG_FILES_NOT_FOUND' },
          () => 'VRChatのログファイルが存在しません',
        )
        .with({ code: 'UNKNOWN' }, () => '不明なエラーが発生しました')
        .otherwise(() => '予期せぬエラーが発生しました');

      log.error({ message: error });

      new Notification({
        title: `joinの記録に失敗しました: ${now.toString()}`,
        body: errorMessage,
      }).show();

      return;
    }

    const {
      createdVRChatPhotoPathModelList,
      createdWorldJoinLogModelList,
      createdPlayerJoinLogModelList,
    } = result.value;
    if (
      createdVRChatPhotoPathModelList.length === 0 &&
      createdWorldJoinLogModelList.length === 0 &&
      createdPlayerJoinLogModelList.length === 0
    ) {
      return;
    }

    const photoCount = createdVRChatPhotoPathModelList.length;
    const worldJoinCount = createdWorldJoinLogModelList.length;
    const playerJoinCount = createdPlayerJoinLogModelList.length;

    new Notification({
      title: `joinの記録に成功しました: ${now.toString()}`,
      body: `${photoCount}枚の新しい写真を記録しました\n${worldJoinCount}件のワールド参加を記録しました\n${playerJoinCount}件のプレイヤー参加を記録しました`,
    }).show();
  });
};

export { setTray, createOrGetWindow, setTimeEventEmitter };
