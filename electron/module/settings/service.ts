import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app } from 'electron';

export const getAppVersion = async (): Promise<string> => {
  // 本番ではnpm_package_versionがundefinedになるので、package.jsonから取得する
  const appVersionDev = process.env.npm_package_version;
  if (appVersionDev !== undefined) {
    return appVersionDev;
  }
  const packageJsonPath = path.join(app.getAppPath(), 'package.json');
  // Convert the file path to a URL format
  const packageJsonUrl = pathToFileURL(packageJsonPath);
  const packageJson = await import(packageJsonUrl.href, {
    assert: { type: 'json' },
  });
  const version = packageJson.default.version;
  if (version === undefined) {
    throw new Error('version is undefined');
  }
  if (typeof version !== 'string') {
    throw new Error('version is not a string');
  }
  return version;
};
