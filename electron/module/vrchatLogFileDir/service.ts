import path from 'node:path';
import * as log from 'electron-log';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
// import type * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import * as fs from '../lib/wrappedFs';
import {
  type VRChatLogFilePath,
  VRChatLogFilePathSchema,
  type VRChatLogFilesDirPath,
  VRChatLogFilesDirPathSchema,
} from './model';

export const getVRChatLogFileDir = async (props: {
  storedLogFilesDirPath: VRChatLogFilesDirPath | null;
}): Promise<{
  storedPath: string | null;
  path: string;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
}> => {
  let logFilesDirPath: VRChatLogFilesDirPath;
  if (props.storedLogFilesDirPath === null) {
    logFilesDirPath = getDefaultVRChatVRChatLogFilesDir();
  } else {
    logFilesDirPath = props.storedLogFilesDirPath;
  }
  const logFileNamesResult = await fs.readdirAsync(logFilesDirPath.value, {
    withFileTypes: true,
  });
  if (logFileNamesResult.isErr()) {
    return match(logFileNamesResult.error)
      .with({ code: 'ENOENT' }, () => {
        return {
          storedPath: logFilesDirPath.value,
          path: logFilesDirPath.value,
          error: 'logFileDirNotFound' as const,
        };
      })
      .exhaustive();
  }
  if (logFileNamesResult.value.length === 0) {
    return {
      storedPath: logFilesDirPath.value,
      path: logFilesDirPath.value,
      error: 'logFilesNotFound',
    };
  }
  return {
    storedPath: logFilesDirPath.value,
    path: logFilesDirPath.value,
    error: null,
  };
};

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

export const getVRChatLogFilePathList = async (
  vrChatlogFilesDir: VRChatLogFilesDirPath,
): Promise<neverthrow.Result<VRChatLogFilePath[], fs.FSError>> => {
  const logFileNamesResult = await fs.readdirAsync(vrChatlogFilesDir.value, {
    withFileTypes: true,
  });
  if (logFileNamesResult.isErr()) {
    return neverthrow.err(
      match(logFileNamesResult.error)
        .with({ code: 'ENOENT' }, () => 'ENOENT' as const)
        .exhaustive(),
    );
  }

  // output_log から始まるファイル名のみを取得
  const logFilePathList = logFileNamesResult.value
    .map((fileName) => {
      try {
        return VRChatLogFilePathSchema.parse(
          `${path.join(vrChatlogFilesDir.value, fileName.name)}`,
        );
      } catch (e) {
        log.warn(e);
        return null;
      }
    })
    .filter((fileName): fileName is VRChatLogFilePath => fileName !== null);
  return neverthrow.ok(logFilePathList);
};

export const getValidVRChatLogFileDir = async (props: {
  storedVRChatLogFilesDirPath: VRChatLogFilesDirPath | null;
}): Promise<
  neverthrow.Result<
    VRChatLogFilesDirPath,
    'logFilesNotFound' | 'logFileDirNotFound'
  >
> => {
  let vrChatlogFilesDir: VRChatLogFilesDirPath;
  if (props.storedVRChatLogFilesDirPath === null) {
    vrChatlogFilesDir = getDefaultVRChatVRChatLogFilesDir();
  } else {
    vrChatlogFilesDir = props.storedVRChatLogFilesDirPath;
  }
  const logFileNamesResult = await getVRChatLogFilePathList(vrChatlogFilesDir);
  if (logFileNamesResult.isErr()) {
    return neverthrow.err(
      match(logFileNamesResult.error)
        .with('ENOENT', () => 'logFileDirNotFound' as const)
        .exhaustive(),
    );
  }
  if (logFileNamesResult.value.length === 0) {
    return neverthrow.err('logFilesNotFound');
  }
  return neverthrow.ok(vrChatlogFilesDir);
};
