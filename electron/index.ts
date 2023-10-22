// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, dialog } from 'electron';
import isDev from 'electron-is-dev';

import * as settingStore from './settingStore';
// 呼び出し元は service に集約したい
import * as service from './service';

const CHANNELS = {
  CLEAR_ALL_STORED_SETTINGS: 'clear-all-stored-settings',
  OPEN_DIALOG_AND_SET_LOG_FILES_DIR: 'open-dialog-and-set-log-files-dir',
  GET_LOG_FILES_DIR: 'get-log-files-dir',
  GET_JOIN_WORLD_LOG_LINES: 'get-join-world-log-lines',
  OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR: 'open-dialog-and-set-vrchat-photo-dir',
  GET_VRCHAT_PHOTO_DIR: 'get-vrchat-photo-dir',
  CREATE_FILES: 'create-files',
  MESSAGE: 'message',
  TOAST: 'toast',
  LOG_FILES_DIR: 'log-files-dir',
  LOG_FILES_DIR_WITH_ERROR: 'log-files-dir-with-error',
  JOIN_WORLD_LOG_LINES: 'join-world-log-lines',
  GET_STATUS_TO_USE_VRCHAT_LOG_FILES_DIR: 'get-status-to-use-vrchat-log-files-dir',
  GET_STATUS_TO_USE_VRCHAT_PHOTO_DIR: 'get-status-to-use-vrchat-photo-dir'
};

const MESSAGE = {
  STATUS_TO_USE_VRCHAT_LOG_FILES_DIR: 'status-to-use-vrchat-log-files-dir',
  STATUS_TO_USE_VRCHAT_PHOTO_DIR: 'status-to-use-vrchat-photo-dir',
  VRCHAT_PHOTO_DIR: 'vrchat-photo-dir',
  VRCHAT_PHOTO_DIR_WITH_ERROR: 'vrchat-photo-dir-with-error'
};

const messages = {
  PATH_NOT_SET: 'Path is not set',
  LOG_PATH_SET: (path: string) => `Log file path set to ${path}`
};

const handleClearAllStoredSettings = () => {
  settingStore.clearAllStoredSettings();
};

const handleOpenDialogAndSetLogFilesDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setLogFilesDir(dirPath);
        event.sender.send(CHANNELS.TOAST, messages.LOG_PATH_SET(dirPath));
        event.sender.send(CHANNELS.LOG_FILES_DIR, dirPath);
      }
    })
    .catch((err) => {
      console.log(err);
      event.sender.send(CHANNELS.TOAST, err.message);
    });
};

const handleGetLogFilesDir = (event: IpcMainEvent) => {
  const logFilesDir = service.getVRChatLogFilesDir(isDev);
  event.sender.send(CHANNELS.LOG_FILES_DIR, logFilesDir.storedPath);
  event.sender.send(CHANNELS.LOG_FILES_DIR_WITH_ERROR, {
    storedPath: logFilesDir.storedPath,
    error: logFilesDir.error
  });
};

const handlegetStatusToUseVRChatLogFilesDir = (event: IpcMainEvent) => {
  const vrchatLogFilesDir = service.getVRChatLogFilesDir(isDev);
  let status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' = 'ready';
  if (vrchatLogFilesDir.storedPath === null) {
    status = 'logFilesDirNotSet';
  }
  if (vrchatLogFilesDir.error !== null) {
    switch (vrchatLogFilesDir.error) {
      case 'logFilesNotFound':
        status = 'logFilesNotFound';
        break;
      default:
        event.sender.send(CHANNELS.TOAST, `Unknown error: ${vrchatLogFilesDir.error}`);
        throw new Error(`Unknown error: ${vrchatLogFilesDir.error}`);
    }
  }
  event.sender.send(MESSAGE.STATUS_TO_USE_VRCHAT_LOG_FILES_DIR, status);
};

const handleOpenDialogAndSetVRChatPhotoDir = (event: IpcMainEvent) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setVRChatPhotoDir(dirPath);
        event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR, dirPath);
        event.sender.send(CHANNELS.TOAST, `VRChat photo path set to ${dirPath}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleGetVRChatPhotoDir = (event: IpcMainEvent) => {
  const vrchatPhotoDir = service.getVRChatPhotoDir();
  event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR, vrchatPhotoDir.storedPath);
  event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR_WITH_ERROR, {
    storedPath: vrchatPhotoDir.storedPath,
    error: vrchatPhotoDir.error
  });
};

const handleCreateFiles = (event: IpcMainEvent) => {
  // get log lines
  const logFilesDir = service.getVRChatLogFilesDir(isDev);
  if (typeof logFilesDir.storedPath !== 'string') {
    event.sender.send('toast', `Log file path is not set`);
    return;
  }
  if (logFilesDir.error !== null) {
    switch (logFilesDir.error) {
      case 'logFilesNotFound':
        event.sender.send('toast', `Log files not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${logFilesDir.error}`);
        break;
    }
    return;
  }
  const convertWorldJoinLogInfoListResult = service.convertLogLinesToWorldJoinLogInfosByVRChatLogDir(
    logFilesDir.storedPath
  );
  if (convertWorldJoinLogInfoListResult.isErr()) {
    switch (convertWorldJoinLogInfoListResult.error.code) {
      case 'LOG_FILE_NOT_FOUND':
        event.sender.send('toast', `Log file not found`);
        break;
      case 'LOG_FILE_DIR_NOT_FOUND':
        event.sender.send('toast', `Log file dir not found`);
        break;
      case 'LOG_FILES_NOT_FOUND':
        event.sender.send('toast', `Log files not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${convertWorldJoinLogInfoListResult.error.code}`);
        break;
    }
    return;
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = service.getVRChatPhotoDir();
  if (typeof vrchatPhotoDir.storedPath !== 'string') {
    event.sender.send('toast', `VRChat photo path is not set`);
    return;
  }
  if (vrchatPhotoDir.error !== null) {
    switch (vrchatPhotoDir.error) {
      case 'photoYearMonthDirsNotFound':
        event.sender.send('toast', `Photo year-month dirs not found`);
        break;
      default:
        event.sender.send('toast', `Unknown error: ${vrchatPhotoDir.error}`);
        break;
    }
    return;
  }

  try {
    service.createFiles(vrchatPhotoDir.storedPath, convertWorldJoinLogInfoList);
    event.sender.send('toast', `Files created`);
  } catch (error) {
    console.log(error);
    event.sender.send('toast', `Error: ${error}`);
  }
};

function registerIpcMainListeners() {
  ipcMain.on(CHANNELS.OPEN_DIALOG_AND_SET_LOG_FILES_DIR, handleOpenDialogAndSetLogFilesDir);
  ipcMain.on(CHANNELS.GET_LOG_FILES_DIR, handleGetLogFilesDir);
  ipcMain.on(CHANNELS.OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR, handleOpenDialogAndSetVRChatPhotoDir);
  ipcMain.on(CHANNELS.GET_VRCHAT_PHOTO_DIR, handleGetVRChatPhotoDir);
  ipcMain.on(CHANNELS.CREATE_FILES, handleCreateFiles);
  ipcMain.on(CHANNELS.GET_STATUS_TO_USE_VRCHAT_LOG_FILES_DIR, handlegetStatusToUseVRChatLogFilesDir);
  ipcMain.on(CHANNELS.CLEAR_ALL_STORED_SETTINGS, handleClearAllStoredSettings);
  ipcMain.on(CHANNELS.MESSAGE, (_, message) => {
    console.log(message);
  });
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
