// Native
import { join } from 'path';

import EventEmitter from 'events';
// Packages
import {
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  app,
  ipcMain,
} from 'electron';
import isDev from 'electron-is-dev';
import { createIPCHandler } from 'electron-trpc/main';
import { router } from './api';

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
  tray.setToolTip('This is my application.');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
};

const setTimeEventEmitter = () => {
  // 1分ごとにtimeイベントをemitする
  const intervalEventEmitter = new EventEmitter();
  setInterval(() => {
    intervalEventEmitter.emit('time', new Date());
  }, 1000 * 20);

  intervalEventEmitter.on('time', (now: Date) => {
    const notification = new Notification({
      title: '時間になりました。',
      body: now.toString(),
    });
    notification.show();
    console.log('time', now, notification);
  });
};

export { setTray, createWindow, setTimeEventEmitter };
