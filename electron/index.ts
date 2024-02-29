// Packages
import { BrowserWindow, app, ipcMain } from 'electron';
import * as log from 'electron-log';
import unhandled from 'electron-unhandled';
import * as electronUtil from './electronUtil';
import { getBackgroundUsecase } from './module/backGroundUsecase';
import { getController } from './module/controller';
import { getSettingStore } from './module/settingStore';

const controller = getController(getSettingStore('v0-settings'));

const CHANNELS = {
  CLEAR_ALL_STORED_SETTINGS: 'clear-all-stored-settings',
  OPEN_DIALOG_AND_SET_LOG_FILES_DIR: 'open-dialog-and-set-log-files-dir',
  GET_LOG_FILES_DIR: 'get-log-files-dir',
  GET_JOIN_WORLD_LOG_LINES: 'get-join-world-log-lines',
  OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR: 'open-dialog-and-set-vrchat-photo-dir',
  GET_VRCHAT_PHOTO_DIR: 'get-vrchat-photo-dir',
  CREATE_FILES: 'create-files',
  ERROR_MESSAGE: 'error-message',
  TOAST: 'toast',
  LOG_FILES_DIR: 'log-files-dir',
  LOG_FILES_DIR_WITH_ERROR: 'log-files-dir-with-error',
  JOIN_WORLD_LOG_LINES: 'join-world-log-lines',
  GET_STATUS_TO_USE_VRCHAT_LOG_FILES_DIR:
    'get-status-to-use-vrchat-log-files-dir',
  GET_STATUS_TO_USE_VRCHAT_PHOTO_DIR: 'get-status-to-use-vrchat-photo-dir',
};

function registerIpcMainListeners() {
  ipcMain.on(
    CHANNELS.OPEN_DIALOG_AND_SET_LOG_FILES_DIR,
    controller.handleOpenDialogAndSetLogFilesDir,
  );
  ipcMain.on(
    CHANNELS.OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR,
    controller.handleOpenDialogAndSetVRChatPhotoDir,
  );
  ipcMain.on(CHANNELS.ERROR_MESSAGE, (_, message) => {
    log.error(message);
  });
}

const backgroundUsecase = getBackgroundUsecase(getSettingStore('v0-settings'));

app
  .whenReady()
  .then(() => {
    registerIpcMainListeners();
    const window = electronUtil.createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0)
        electronUtil.createWindow();
    });

    if (backgroundUsecase.getIsEnabledBackgroundProcess()) {
      electronUtil.setTimeEventEmitter();
      electronUtil.setTray(window);
    }

    // エラーを記録する
    unhandled({
      logger: (error) => {
        log.error(error);
      },
    });
    process.on('uncaughtException', (error) => {
      log.error(error);
    });
    process.on('unhandledRejection', (error) => {
      log.error(error);
    });
    window.webContents.on('crashed', (error) => {
      log.error(error);
    });
  })
  .catch((error) => {
    log.error(error);
  });

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    return;
  }
  // background処理が有効になっている場合は終了しない
  if (backgroundUsecase.getIsEnabledBackgroundProcess()) {
    return;
  }
  app.quit();
});
