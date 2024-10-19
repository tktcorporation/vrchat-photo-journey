import { app } from 'electron';

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
