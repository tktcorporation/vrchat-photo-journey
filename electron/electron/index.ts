// Native
import { join } from 'path';

import Store from 'electron-store';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, dialog } from 'electron';
import isDev from 'electron-is-dev';

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process

import { getJoinWorldLogLines } from './service';

const height = 600;
const width = 800;

const settingsStore = new Store({name: 'v0-settings'});

function createWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  // window.webContents.openDevTools();

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send('message', 'hi from electron'), 500);
});

// store log file path to use later
ipcMain.on('set-log-file-path', (event: IpcMainEvent, path: string) => {
  console.log(path);
  localStorage.setItem('logFilePath', path);
  event.sender.send('toast', `Log file path set to ${path}`);
})

ipcMain.on('open-dialog-and-set-log-files-dir', (event: IpcMainEvent) => {
  console.log('open-dialog-and-set-log-files-dir');
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then((result) => {
    console.log(result);
    if (!result.canceled) {
      const dirPath = result.filePaths[0];
      settingsStore.set('logFilesDir', dirPath);
      event.sender.send('toast', `Log file path set to ${dirPath}`);
    }
  }).catch((err) => {
    console.log(err);
  })
})

ipcMain.on('get-log-files-dir', (event: IpcMainEvent) => {
  const logFilesDir = settingsStore.get('logFilesDir');
  if (typeof logFilesDir !== 'string') {
    event.sender.send('toast', `Log file path is not set`);
    return;
  }
  event.sender.send('log-files-dir', logFilesDir);

  const logLines = getJoinWorldLogLines(logFilesDir);
  event.sender.send('join-world-log-lines', logLines);
})

ipcMain.on('get-join-world-log-lines', (event: IpcMainEvent) => {
  console.log('get-join-world-log-lines');
  const logFilesDir = settingsStore.get('logFilesDir');
  if (typeof logFilesDir !== 'string') {
    event.sender.send('toast', `Log file path is not set`);
    return;
  }
  const logLines = getJoinWorldLogLines(logFilesDir);
  event.sender.send('join-world-log-lines', logLines);
})

// ipcMain.on('create-world-join-log-to-photo-dir', (event: IpcMainEvent) => {
//   console.log('create-world-join-log-to-photo-dir');
//   const logFilesDir = settingsStore.get('logFilesDir');
//   if (typeof logFilesDir !== 'string') {
//     event.sender.send('toast', `Log file path is not set`);
//     return;
//   }
//   const logLines = getJoinWorldLogLines(logFilesDir);
  
// }
  
