// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, dialog } from 'electron';
import isDev from 'electron-is-dev';

import * as settingStore from './settingStore';
// 呼び出し元は service に集約したい
import { createFiles, getLogLinesFromDir, convertLogLinesToWorldJoinLogInfos } from './service';

const CHANNELS = {
  OPEN_DIALOG_AND_SET_LOG_FILES_DIR: 'open-dialog-and-set-log-files-dir',
  GET_LOG_FILES_DIR: 'get-log-files-dir',
  GET_JOIN_WORLD_LOG_LINES: 'get-join-world-log-lines',
  OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR: 'open-dialog-and-set-vrchat-photo-dir',
  GET_VRCHAT_PHOTO_DIR: 'get-vrchat-photo-dir',
  CREATE_FILES: 'create-files',
  MESSAGE: 'message',
  TOAST: 'toast',
  LOG_FILES_DIR: 'log-files-dir',
  JOIN_WORLD_LOG_LINES: 'join-world-log-lines',
  VRCHAT_PHOTO_DIR: 'vrchat-photo-dir'
};

const messages = {
  PATH_NOT_SET: 'Path is not set',
  LOG_PATH_SET: (path: string) => `Log file path set to ${path}`
};

const handleOpenDialogAndSetLogFilesDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.set('logFilesDir', dirPath);
        event.sender.send(CHANNELS.TOAST, messages.LOG_PATH_SET(dirPath));
        event.sender.send(CHANNELS.LOG_FILES_DIR, dirPath);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleGetLogFilesDir = (event: IpcMainEvent) => {
  const logFilesDir = settingStore.get('logFilesDir');
  if (typeof logFilesDir !== 'string') {
    event.sender.send(CHANNELS.TOAST, messages.PATH_NOT_SET);
    return;
  }
  event.sender.send(CHANNELS.LOG_FILES_DIR, logFilesDir);
};

const handleGetJoinWorldLogLines = (event: IpcMainEvent) => {
  const logFilesDir = settingStore.get('logFilesDir');
  if (typeof logFilesDir !== 'string') {
    event.sender.send(CHANNELS.TOAST, messages.PATH_NOT_SET);
    return;
  }
  const logLines = getLogLinesFromDir(logFilesDir);
  event.sender.send(CHANNELS.JOIN_WORLD_LOG_LINES, logLines);
};

const handleOpenDialogAndSetVRChatPhotoDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.set('vrchatPhotoDir', dirPath);
        event.sender.send(CHANNELS.VRCHAT_PHOTO_DIR, dirPath);
        event.sender.send(CHANNELS.TOAST, `VRChat photo path set to ${dirPath}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleGetVRChatPhotoDir = (event: IpcMainEvent) => {
  const vrchatPhotoDir = settingStore.get('vrchatPhotoDir');
  if (typeof vrchatPhotoDir !== 'string') {
    event.sender.send(CHANNELS.TOAST, messages.PATH_NOT_SET);
    return;
  }
  event.sender.send(CHANNELS.VRCHAT_PHOTO_DIR, vrchatPhotoDir);
};

const handleCreateFiles = (event: IpcMainEvent) => {
  // get log lines
  const logFilesDir = settingStore.get('logFilesDir');
  if (typeof logFilesDir !== 'string') {
    event.sender.send('toast', `Log file path is not set`);
    return;
  }
  const logLines = getLogLinesFromDir(logFilesDir);
  const convertWorldJoinLogInfoList = convertLogLinesToWorldJoinLogInfos(logLines);

  // create files
  const vrchatPhotoDir = settingStore.get('vrchatPhotoDir');
  if (typeof vrchatPhotoDir !== 'string') {
    event.sender.send('toast', `World visit log file path is not set`);
    return;
  }
  try {
    createFiles(vrchatPhotoDir, convertWorldJoinLogInfoList);
    event.sender.send('toast', `Files created`);
  } catch (error) {
    console.log(error);
    event.sender.send('toast', `Error: ${error}`);
  }
};

function registerIpcMainListeners() {
  ipcMain.on(CHANNELS.OPEN_DIALOG_AND_SET_LOG_FILES_DIR, handleOpenDialogAndSetLogFilesDir);
  ipcMain.on(CHANNELS.GET_LOG_FILES_DIR, handleGetLogFilesDir);
  ipcMain.on(CHANNELS.GET_JOIN_WORLD_LOG_LINES, handleGetJoinWorldLogLines);
  ipcMain.on(CHANNELS.OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR, handleOpenDialogAndSetVRChatPhotoDir);
  ipcMain.on(CHANNELS.GET_VRCHAT_PHOTO_DIR, handleGetVRChatPhotoDir);
  ipcMain.on(CHANNELS.CREATE_FILES, handleCreateFiles);
}

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
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');

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
    // eslint-disable-next-line no-unused-expressions
    mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
  });

  ipcMain.on('close', () => {
    mainWindow.close();
  });

  return mainWindow;
}

app.whenReady().then(() => {
  registerIpcMainListeners();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
