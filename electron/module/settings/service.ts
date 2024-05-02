import path from 'node:path';
import { app } from 'electron';

export const getAppVersion = async (): Promise<string> => {
  // 本番ではnpm_package_versionがundefinedになるので、package.jsonから取得する
  const appVersionDev = process.env.npm_package_version;
  if (appVersionDev !== undefined) {
    return appVersionDev;
  }
  // Construct path to package.json within the asar archive
  const packageJsonPath = path.join(app.getAppPath(), 'package.json');
  const { version } = await import(packageJsonPath);
  if (version === undefined) {
    throw new Error('version is undefined');
  }
  if (typeof version !== 'string') {
    throw new Error('version is not a string');
  }
  return version;
};
