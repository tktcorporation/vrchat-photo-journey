import * as datefns from 'date-fns';
import path from 'node:path';
import readline from 'node:readline';
import * as log from 'electron-log';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as fs from '../lib/wrappedFs'
// import type * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import * as z from 'zod';
import { VRChatLogFilePath, VRChatLogFilePathSchema, VRChatLogFilesDirPath, VRChatLogFilesDirPathSchema } from './model';

const getDefaultVRChatVRChatLogFilesDir = (): VRChatLogFilesDirPath => {
  let VRChatlogFilesDir = '';
  if (process.platform === 'win32' && process.env.APPDATA) {
    const DEFAULT_VRCHAT_LOG_FILES_DIR = path.join(
      process.env.APPDATA || '',
      '..',
      'LocalLow',
      'VRChat',
      'VRChat',
    );
    VRChatlogFilesDir = DEFAULT_VRCHAT_LOG_FILES_DIR;
  } else {
    // 仮置き
    VRChatlogFilesDir = path.join(
      process.env.HOME || '',
      'Library',
      'Application Support',
      'com.vrchat.VRChat',
      'VRChat',
    );
  }
  return VRChatLogFilesDirPathSchema.parse(VRChatlogFilesDir);
};

export const getVRChatLogFilePathList = (
  vrChatlogFilesDir: VRChatLogFilesDirPath,
): neverthrow.Result<VRChatLogFilePath[], fs.FSError> => {
  const logFileNamesResult = fs.readDirSyncSafe(vrChatlogFilesDir.value);
  if (logFileNamesResult.isErr()) {
    return neverthrow.err(logFileNamesResult.error);
  }

  // output_log から始まるファイル名のみを取得
  const logFilePathList = logFileNamesResult.value.map(
    (fileName) => {
        try {
            return VRChatLogFilePathSchema.parse(`${path.join(vrChatlogFilesDir.value, fileName)}`);
        } catch (e) {
            return null
        }
    }).filter((fileName): fileName is VRChatLogFilePath => fileName !== null);
  return neverthrow.ok(logFilePathList);
};

export const getValidVRChatLogFileDir = (props: {
  storedVRChatLogFilesDirPath: VRChatLogFilesDirPath | null;
}): neverthrow.Result<
  VRChatLogFilesDirPath,
  'logFilesNotFound' | 'logFileDirNotFound'
> => {
  let vrChatlogFilesDir: VRChatLogFilesDirPath;
  if (props.storedVRChatLogFilesDirPath === null) {
    vrChatlogFilesDir = getDefaultVRChatVRChatLogFilesDir();
  } else {
    vrChatlogFilesDir = props.storedVRChatLogFilesDirPath;
  }
  const logFileNamesResult = getVRChatLogFilePathList(vrChatlogFilesDir);
  if (logFileNamesResult.isErr()) {
    switch (logFileNamesResult.error) {
      case 'ENOENT':
        return neverthrow.err('logFileDirNotFound');
      default:
        throw logFileNamesResult.error;
    }
  }
  if (logFileNamesResult.value.length === 0) {
    return neverthrow.err('logFilesNotFound');
  }
  return neverthrow.ok(vrChatlogFilesDir);
};

