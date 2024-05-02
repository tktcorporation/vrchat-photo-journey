import path from 'node:path';
import { app } from 'electron';
import * as fs from '../../lib/wrappedFs';

export const getAppVersion = async (): Promise<string> => {
  // 本番ではnpm_package_versionがundefinedになるので、package.jsonから取得する
  const appVersionDev = process.env.npm_package_version;
  if (appVersionDev !== undefined) {
    return appVersionDev;
  }
  // asar アーカイブ内の package.json へのパスを構築
  const packageJsonPath = path.join(app.getAppPath(), 'package.json');
  // package.json ファイルを同期的に読み込む
  const fileResult = fs.readFileSyncSafe(packageJsonPath);
  if (fileResult.isErr()) {
    throw fileResult.error;
  }
  const packageJson = JSON.parse(fileResult.value.toString('utf-8'));
  const version = packageJson.version;
  if (version === undefined) {
    throw new Error('version is undefined');
  }
  if (typeof version !== 'string') {
    throw new Error('version is not a string');
  }
  return version;
};
