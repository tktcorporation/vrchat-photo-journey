import { app } from 'electron';
import { type UpdateCheckResult, autoUpdater } from 'electron-updater';

export const getAppVersion = async (): Promise<string> => {
  // 本番では app.getVersion() を使用してバージョンを取得
  const appVersionDev = process.env.npm_package_version;
  if (appVersionDev !== undefined) {
    return appVersionDev;
  }

  // Electron の app.getVersion() を使用してバージョンを取得
  const appVersion = app.getVersion();

  if (!appVersion) {
    throw new Error('App version is undefined');
  }

  return appVersion;
};

export const getElectronUpdaterInfo = async (): Promise<
  | {
      isUpdateAvailable: false;
      updateInfo: null;
    }
  | {
      isUpdateAvailable: true;
      updateInfo: UpdateCheckResult;
    }
> => {
  const updateInfo = await autoUpdater.checkForUpdates().catch((error) => {
    console.error('Failed to check for updates', error);
    return null;
  });
  if (!updateInfo) {
    return {
      isUpdateAvailable: false as const,
      updateInfo: null,
    };
  }
  return {
    isUpdateAvailable: true as const,
    updateInfo: updateInfo as UpdateCheckResult,
  };
};

export const installUpdate = async (): Promise<void> => {
  await autoUpdater.downloadUpdate();
  await autoUpdater.quitAndInstall();
};
