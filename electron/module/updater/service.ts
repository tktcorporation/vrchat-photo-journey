import { autoUpdater } from 'electron-updater';
import { BehaviorSubject } from 'rxjs';

export class UpdaterService {
  private updateDownloaded = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeAutoUpdater();
  }

  private initializeAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-downloaded', () => {
      this.updateDownloaded.next(true);
    });
  }

  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('アップデートの確認中にエラーが発生しました:', error);
    }
  }

  public async quitAndInstall() {
    autoUpdater.quitAndInstall();
  }

  public getUpdateDownloaded() {
    return this.updateDownloaded.value;
  }

  public subscribeToUpdateDownloaded(callback: (downloaded: boolean) => void) {
    return this.updateDownloaded.subscribe(callback);
  }
}
