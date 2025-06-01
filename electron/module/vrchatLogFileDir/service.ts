import path from 'node:path';
import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
// import type * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import * as fs from '../../lib/wrappedFs';
import { getSettingStore } from '../settingStore';
import * as log from './../../lib/logger';
import {
  type NotValidatedVRChatLogFilesDirPath,
  NotValidatedVRChatLogFilesDirPathSchema,
  type VRChatLogFilePath,
  VRChatLogFilePathSchema,
  type VRChatLogFilesDirPath,
  VRChatLogFilesDirPathSchema,
} from './model';

const getStoredVRChatLogFilesDirPath =
  async (): Promise<NotValidatedVRChatLogFilesDirPath | null> => {
    const settingStore = getSettingStore();
    return match(settingStore.getLogFilesDir())
      .with(null, () => {
        return null;
      })
      .with(P.string, (path) => {
        return NotValidatedVRChatLogFilesDirPathSchema.parse(path);
      })
      .exhaustive();
  };

export const getValidVRChatLogFileDir = async (): Promise<
  neverthrow.Result<
    {
      path: VRChatLogFilesDirPath;
      storedPath: NotValidatedVRChatLogFilesDirPath | null;
    },
    {
      error: 'logFilesNotFound' | 'logFileDirNotFound';
      storedPath: NotValidatedVRChatLogFilesDirPath | null;
      path: NotValidatedVRChatLogFilesDirPath;
    }
  >
> => {
  const storedVRChatLogFilesDirPath = await getStoredVRChatLogFilesDirPath();
  let vrChatlogFilesDir: NotValidatedVRChatLogFilesDirPath;
  if (storedVRChatLogFilesDirPath === null) {
    vrChatlogFilesDir = getDefaultVRChatVRChatLogFilesDir();
  } else {
    vrChatlogFilesDir = storedVRChatLogFilesDirPath;
  }
  const logFileNamesResult = await getVRChatLogFilePathList(vrChatlogFilesDir);
  if (logFileNamesResult.isErr()) {
    return neverthrow.err({
      error: match(logFileNamesResult.error)
        .with('ENOENT', () => 'logFileDirNotFound' as const)
        .exhaustive(),
      storedPath: storedVRChatLogFilesDirPath,
      path: vrChatlogFilesDir,
    });
  }
  if (logFileNamesResult.value.length === 0) {
    return neverthrow.err({
      error: 'logFilesNotFound',
      path: vrChatlogFilesDir,
      storedPath: storedVRChatLogFilesDirPath,
    });
  }
  const validatedVRChatLogFilesDirPath = VRChatLogFilesDirPathSchema.parse(
    vrChatlogFilesDir.value,
  );
  return neverthrow.ok({
    path: validatedVRChatLogFilesDirPath,
    storedPath: storedVRChatLogFilesDirPath,
  });
};

export const getVRChatLogFileDir = async (): Promise<{
  storedPath: NotValidatedVRChatLogFilesDirPath | null;
  path: NotValidatedVRChatLogFilesDirPath | VRChatLogFilesDirPath;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
}> => {
  const validatedResult = await getValidVRChatLogFileDir();
  if (validatedResult.isErr()) {
    return {
      storedPath: validatedResult.error.storedPath,
      path: validatedResult.error.path,
      error: validatedResult.error.error,
    };
  }
  return {
    storedPath: validatedResult.value.storedPath,
    path: validatedResult.value.path,
    error: null,
  };
};

const getDefaultVRChatVRChatLogFilesDir =
  (): NotValidatedVRChatLogFilesDirPath => {
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
    return NotValidatedVRChatLogFilesDirPathSchema.parse(VRChatlogFilesDir);
  };

/**
 * VRChatのログファイルのパス一覧を取得する
 */
export const getVRChatLogFilePathList = async (
  vrChatlogFilesDir: VRChatLogFilesDirPath | NotValidatedVRChatLogFilesDirPath,
): Promise<neverthrow.Result<VRChatLogFilePath[], fs.FSError>> => {
  const logFileNamesResult = await fs.readdirAsync(vrChatlogFilesDir.value, {
    withFileTypes: true,
    encoding: 'buffer',
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
          `${path.join(vrChatlogFilesDir.value, fileName.name.toString())}`,
        );
      } catch (e) {
        log.debug('generally ignore this log', e);
        return null;
      }
    })
    .filter((fileName): fileName is VRChatLogFilePath => fileName !== null);
  return neverthrow.ok(logFilePathList);
};
