import { app } from 'electron';
import { type UpdateCheckResult, autoUpdater } from 'electron-updater';
import * as log from '../../lib/logger';

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

export const getElectronUpdaterInfo = async (): Promise<{
  isUpdateAvailable: boolean;
  updateInfo: UpdateCheckResult | null;
}> => {
  const updateInfo = await autoUpdater.checkForUpdates().catch((error) => {
    console.error('Failed to check for updates', error);
    return null;
  });
  if (!updateInfo) {
    return {
      isUpdateAvailable: false,
      updateInfo: null,
    };
  }
  log.debug('Update info:', updateInfo);
  return {
    isUpdateAvailable: updateInfo.updateInfo.version !== app.getVersion(),
    updateInfo: updateInfo as UpdateCheckResult,
  };
};

export const installUpdate = async (): Promise<void> => {
  const updateInfo = await getElectronUpdaterInfo();
  if (!updateInfo.isUpdateAvailable) {
    throw new Error('No updates available');
  }
  await autoUpdater.downloadUpdate();
  await autoUpdater.quitAndInstall();
};

export const isUpdateAvailable = async (): Promise<boolean> => {
  const updateInfo = await getElectronUpdaterInfo();
  return updateInfo.isUpdateAvailable;
};
