import { ipcRenderer, contextBridge } from 'electron';

declare global {
  interface Window {
    Main: typeof api;
    ipcRenderer: typeof ipcRenderer;
  }
}

const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sayHello`
   */
  sendMessage: (message: string) => {
    ipcRenderer.send('message', message);
  },
  setLogFilePath: (path: string) => {
    ipcRenderer.send('set-log-file-path', path);
  },
  openDialogAndSetLogFilesDir: () => {
    ipcRenderer.send('open-dialog-and-set-log-files-dir');
  },
  getLogFilesDir: () => {
    ipcRenderer.send('get-log-files-dir');
  },
  openDialogAndSetVRChatPhotoDir: () => {
    ipcRenderer.send('open-dialog-and-set-vrchat-photo-dir');
  },
  getVRChatPhotoDir: () => {
    ipcRenderer.send('get-vrchat-photo-dir');
  },
  getStatusToUseVRChatLogFilesDir: () => {
    ipcRenderer.send('get-status-to-use-vrchat-log-files-dir');
  },
  createFiles: () => {
    ipcRenderer.send('create-files');
  },
  clearAllStoredSettings: () => {
    ipcRenderer.send('clear-all-stored-settings');
  },
  /**
    Here function for AppBar
   */
  Minimize: () => {
    ipcRenderer.send('minimize');
  },
  Maximize: () => {
    ipcRenderer.send('maximize');
  },
  Close: () => {
    ipcRenderer.send('close');
  },
  /**
   * Provide an easier way to listen to events
   */
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};
contextBridge.exposeInMainWorld('Main', api);
/**
 * Using the ipcRenderer directly in the browser through the contextBridge ist not really secure.
 * I advise using the Main/api way !!
 */
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
