import path from 'path';
import readline from 'readline';
import * as log from 'electron-log';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as fs from '../../lib/wrappedFs';
import VRChatLogFileError from './error';

import { type JoinInfoFileName, convertToJoinInfoFileName } from '../type';

type WorldId = `wrld_${string}`;
interface WorldJoinLogInfo {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  worldId: WorldId;
  worldName: string;
}

interface VRChatLogFilesDirWithErr {
  storedPath: string | null;
  path: string;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
}

const getVRChatLogFileNamesByDir = (
  logFilesDir: string,
): neverthrow.Result<string[], fs.FSError> => {
  const logFileNamesResult = fs.readDirSyncSafe(logFilesDir);
  // output_log から始まるファイル名のみを取得
  const logFileNamesFiltered = logFileNamesResult.map((logFileNames) =>
    logFileNames.filter((fileName) => fileName.startsWith('output_log')),
  );
  return logFileNamesFiltered;
};

const getDefaultVRChatLogFilesDir = (): string => {
  let logFilesDir = '';
  if (process.platform === 'win32' && process.env.APPDATA) {
    const DEFAULT_VRCHAT_LOG_FILES_DIR = path.join(
      process.env.APPDATA || '',
      '..',
      'LocalLow',
      'VRChat',
      'VRChat',
    );
    logFilesDir = DEFAULT_VRCHAT_LOG_FILES_DIR;
  } else {
    // 仮置き
    logFilesDir = path.join(
      process.env.HOME || '',
      'Library',
      'Application Support',
      'com.vrchat.VRChat',
      'VRChat',
    );
  }
  return logFilesDir;
};

const getVRChatLogFileDir = (props: {
  storedLogFilesDirPath: string | null;
}): VRChatLogFilesDirWithErr => {
  let logFilesDir: string;
  if (props.storedLogFilesDirPath === null) {
    logFilesDir = getDefaultVRChatLogFilesDir();
  } else {
    logFilesDir = props.storedLogFilesDirPath;
  }
  const logFileNamesResult = getVRChatLogFileNamesByDir(logFilesDir);
  if (logFileNamesResult.isErr()) {
    switch (logFileNamesResult.error) {
      case 'ENOENT':
        return {
          storedPath: props.storedLogFilesDirPath,
          path: logFilesDir,
          error: 'logFileDirNotFound',
        };
      default:
        throw logFileNamesResult.error;
    }
  }
  if (logFileNamesResult.value.length === 0) {
    return {
      storedPath: props.storedLogFilesDirPath,
      path: logFilesDir,
      error: 'logFilesNotFound',
    };
  }
  return {
    storedPath: props.storedLogFilesDirPath,
    path: logFilesDir,
    error: null,
  };
};

const validateWorldId = (value: string): value is WorldId => {
  const regex = /^wrld_[a-f0-9-]+$/;
  return regex.test(value);
};

const getLogLinesFromLogFileName = async (props: {
  storedLogFilesDirPath: string | null;
  logFilePath: string;
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  const logFilesDir = getVRChatLogFileDir({
    storedLogFilesDirPath: props.storedLogFilesDirPath,
  });
  if (logFilesDir.error) {
    return match(logFilesDir.error)
      .with('logFileDirNotFound', () =>
        neverthrow.err(new VRChatLogFileError('LOG_FILE_DIR_NOT_FOUND')),
      )
      .with('logFilesNotFound', () =>
        neverthrow.err(new VRChatLogFileError('LOG_FILES_NOT_FOUND')),
      )
      .exhaustive();
  }

  const stream = fs.createReadStream(props.logFilePath);
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  const lines: string[] = [];
  reader.on('line', (line) => {
    if (line.includes('Joining')) {
      lines.push(line);
    }
  });
  await Promise.all([
    new Promise((resolve) => {
      stream.on('close', () => {
        resolve(null);
      });
    }),
  ]);
  return neverthrow.ok(lines);
};

const getLogLinesFromDir = async (props: {
  storedLogFilesDirPath: string | null;
  logFilesDir: string;
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  // output_log から始まるファイル名のみを取得
  const logFileNamesFilteredResult = getVRChatLogFileNamesByDir(
    props.logFilesDir,
  );
  const logFileNamesFiltered = logFileNamesFilteredResult.mapErr((e) => {
    switch (e) {
      case 'ENOENT':
        return new VRChatLogFileError('LOG_FILE_DIR_NOT_FOUND');
      default:
        throw e;
    }
  });
  if (logFileNamesFiltered.isErr()) {
    return neverthrow.err(logFileNamesFiltered.error);
  }
  if (logFileNamesFiltered.value.length === 0) {
    return neverthrow.err(new VRChatLogFileError('LOG_FILES_NOT_FOUND'));
  }

  const logLines: string[] = [];
  const errors: VRChatLogFileError[] = [];
  await Promise.all(
    logFileNamesFiltered.value.map(async (fileName) => {
      const filePath = path.join(props.logFilesDir, fileName);
      const result = await getLogLinesFromLogFileName({
        storedLogFilesDirPath: props.storedLogFilesDirPath,
        logFilePath: filePath,
      });
      if (result.isErr()) {
        errors.push(result.error);
        return;
      }
      logLines.push(...result.value);
    }),
  );
  if (errors.length > 0) {
    return neverthrow.err(errors[0]);
  }
  return neverthrow.ok(logLines);
};

const extractWorldJoinInfoFromLogs = (
  logLines: string[],
  index: number,
): WorldJoinLogInfo | null => {
  const logEntry = logLines[index];
  const regex =
    /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}) .* \[Behaviour\] Joining (wrld_[a-f0-9-]+):.*/;
  const matches = logEntry.match(regex);

  if (!matches || matches.length < 4) {
    return null;
  }
  const date = matches[1].replace(/\./g, '-');
  const time = matches[2].replace(/:/g, '-');
  const worldId = matches[3];

  if (!validateWorldId(worldId)) {
    throw new Error('WorldId did not match the expected format');
  }

  const [year, month, day] = date.split('-');
  const [hour, minute, second] = time.split('-');
  let foundWorldName: string | null = null;
  // Extracting world name from the subsequent lines
  for (const l of logLines.slice(index + 1)) {
    const worldNameRegex = /\[Behaviour\] Joining or Creating Room: (.+)/;
    const [, worldName] = l.match(worldNameRegex) || [];
    if (worldName && !foundWorldName) {
      foundWorldName = worldName;
    }
  }

  if (foundWorldName) {
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      worldId,
      worldName: foundWorldName,
    };
  }

  throw new Error(
    'Failed to extract world name from the subsequent log entries',
  );
};

const convertLogLinesToWorldJoinLogInfos = (
  logLines: string[],
): WorldJoinLogInfo[] => {
  const worldJoinLogInfos: WorldJoinLogInfo[] = [];
  log.debug('convertLogLinesToWorldJoinLogInfos');
  for (const [index, l] of logLines.entries()) {
    if (l.includes('Joining wrld')) {
      const info = extractWorldJoinInfoFromLogs(logLines, index);
      if (info) {
        worldJoinLogInfos.push(info);
      }
    }
  }

  return worldJoinLogInfos;
};

type WorldJoinLogInfoOneLine = string;
const convertWorldJoinLogInfoToOneLine = (
  worldJoinLogInfo: WorldJoinLogInfo,
): JoinInfoFileName => {
  const { year, month, day, hour, minute, second, worldId } = worldJoinLogInfo;
  // output: VRChat_2023-10-08_00-03-00.000_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f
  return convertToJoinInfoFileName({
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond: '000',
    worldId,
  });
};

export {
  getVRChatLogFileDir,
  getVRChatLogFileNamesByDir,
  getLogLinesFromDir,
  extractWorldJoinInfoFromLogs,
  convertLogLinesToWorldJoinLogInfos,
  convertWorldJoinLogInfoToOneLine,
};
export type { WorldId, WorldJoinLogInfo, WorldJoinLogInfoOneLine };
