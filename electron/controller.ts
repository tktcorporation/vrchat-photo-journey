import { dialog } from 'electron';
import * as settingStore from './settingStore';

export const handleClearAllStoredSettings = () => {
  settingStore.clearAllStoredSettings();
};

export const handleOpenDialogAndSetLogFilesDir = () => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setLogFilesDir(dirPath);
        // event.sender.send(MESSAGE.TOAST, messages.LOG_PATH_SET(dirPath));
        // event.sender.send(MESSAGE.LOG_FILES_DIR, dirPath);
      }
    })
    .catch((err) => {
      console.log(err);
      // event.sender.send(MESSAGE.TOAST, err.message);
    });
};

export const handleOpenDialogAndSetVRChatPhotoDir = () => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      if (!result.canceled) {
        const dirPath = result.filePaths[0];
        settingStore.setVRChatPhotoDir(dirPath);
        // event.sender.send(MESSAGE.VRCHAT_PHOTO_DIR, dirPath);
        // event.sender.send(MESSAGE.TOAST, `VRChat photo path set to ${dirPath}`);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
