import readline from 'node:readline';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
import * as fs from '../lib/wrappedFs';

import path from 'node:path';
import { getAppUserDataPath } from '../lib/wrappedApp';
import type {
  VRChatLogFilePath,
  VRChatLogFilesDirPath,
} from '../vrchatLogFileDir/model';
import * as vrchatLogFileDirService from '../vrchatLogFileDir/service';
import { VRChatLogFileError } from './error';
import {
  type VRChatLogLine,
  VRChatLogLineSchema,
  type VRChatLogStoreFilePath,
  VRChatLogStoreFilePathSchema,
} from './model';

type WorldId = `wrld_${string}`;
export interface VRChatWorldJoinLog {
  logType: 'worldJoin';
  joinDate: Date;
  worldId: WorldId;
  worldInstanceId: string;
  worldName: string;
}
export interface VRChatPlayerJoinLog {
  logType: 'playerJoin';
  joinDate: Date;
  playerName: string;
}

export const getVRChaLogInfoFromLogPath = async (
  logFilesDir: VRChatLogFilesDirPath,
): Promise<
  neverthrow.Result<
    (VRChatWorldJoinLog | VRChatPlayerJoinLog)[],
    VRChatLogFileError
  >
> => {
  const logFilePathList =
    await vrchatLogFileDirService.getVRChatLogFilePathList(logFilesDir);
  if (logFilePathList.isErr()) {
    return neverthrow.err(
      match(logFilePathList.error)
        .with('ENOENT', () => new VRChatLogFileError('LOG_FILE_DIR_NOT_FOUND'))
        .exhaustive(),
    );
  }

  const logInfoList = await getVRChaLogInfoByLogFilePathList(
    logFilePathList.value,
  );
  if (logInfoList.isErr()) {
    return neverthrow.err(logInfoList.error);
  }
  return neverthrow.ok(logInfoList.value);
};

export const getVRChaLogInfoByLogFilePathList = async (
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[],
): Promise<
  neverthrow.Result<
    (VRChatWorldJoinLog | VRChatPlayerJoinLog)[],
    VRChatLogFileError
  >
> => {
  const logLineList = await getLogLinesByLogFilePathList({
    logFilePathList,
    includesList: ['[Behaviour] OnPlayerJoinComplete', '[Behaviour] Joining '],
  });
  if (logLineList.isErr()) {
    return neverthrow.err(logLineList.error);
  }

  const logInfoList: (VRChatWorldJoinLog | VRChatPlayerJoinLog)[] =
    convertLogLinesToWorldAndPlayerJoinLogInfos(logLineList.value);

  return neverthrow.ok(logInfoList);
};

export const getLogLinesByLogFilePathList = async (props: {
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[];
  includesList: string[];
}): Promise<neverthrow.Result<VRChatLogLine[], VRChatLogFileError>> => {
  const logLineList: VRChatLogLine[] = [];
  const errors: VRChatLogFileError[] = [];
  await Promise.all(
    props.logFilePathList.map(async (logFilePath) => {
      const result = await getLogLinesFromLogFileName({
        logFilePath,
        includesList: props.includesList,
      });
      if (result.isErr()) {
        errors.push(result.error);
        return;
      }
      logLineList.push(
        ...result.value.map((line) => VRChatLogLineSchema.parse(line)),
      );
    }),
  );

  if (errors.length > 0) {
    return neverthrow.err(errors[0]);
  }

  return neverthrow.ok(logLineList);
};

const getLogLinesFromLogFileName = async (props: {
  logFilePath: VRChatLogFilePath | VRChatLogStoreFilePath;
  includesList: string[];
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  const stream = fs.createReadStream(props.logFilePath.value);
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  const lines: string[] = [];
  reader.on('line', (line) => {
    // worldJoin も playerJoin も含むログも Join が含まれる
    // includesList の配列の中のどれかと一致したら追加
    if (props.includesList.some((include) => line.includes(include))) {
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

const convertLogLinesToWorldAndPlayerJoinLogInfos = (
  logLines: VRChatLogLine[],
): (VRChatWorldJoinLog | VRChatPlayerJoinLog)[] => {
  const logInfos: (VRChatWorldJoinLog | VRChatPlayerJoinLog)[] = [];
  for (const [index, l] of logLines.entries()) {
    if (l.value.includes('Joining wrld')) {
      const info = extractWorldJoinInfoFromLogs(logLines, index);
      if (info) {
        logInfos.push(info);
      }
    }
    if (l.value.includes('OnPlayerJoined')) {
      const info = extractPlayerJoinInfoFromLog(l);
      if (info) {
        logInfos.push(info);
      }
    }
  }

  return logInfos;
};

const extractWorldJoinInfoFromLogs = (
  logLines: VRChatLogLine[],
  index: number,
): VRChatWorldJoinLog | null => {
  const validateWorldId = (value: string): value is WorldId => {
    const regex = /^wrld_[a-f0-9-]+$/;
    return regex.test(value);
  };

  const logEntry = logLines[index];
  const regex =
    /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}) .* \[Behaviour\] Joining (wrld_[a-f0-9-]+):(.*)/;
  const matches = logEntry.value.match(regex);

  if (!matches || matches.length < 4) {
    return null;
  }
  const date = matches[1].replace(/\./g, '-');
  const time = matches[2].replace(/:/g, '-');
  const worldId = matches[3];
  const instanceId = matches[4];

  if (!validateWorldId(worldId)) {
    throw new Error('WorldId did not match the expected format');
  }

  const [year, month, day] = date.split('-');
  const [hour, minute, second] = time.split('-');
  let foundWorldName: string | null = null;
  // Extracting world name from the subsequent lines
  for (const l of logLines.slice(index + 1)) {
    const worldNameRegex = /\[Behaviour\] Joining or Creating Room: (.+)/;
    const [, worldName] = l.value.match(worldNameRegex) || [];
    if (worldName && !foundWorldName) {
      foundWorldName = worldName;
    }
  }

  if (foundWorldName) {
    const joinDate = datefns.parse(
      `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date(),
    );
    return {
      logType: 'worldJoin',
      joinDate,
      worldInstanceId: instanceId,
      worldId,
      worldName: foundWorldName,
    };
  }

  throw new Error(
    'Failed to extract world name from the subsequent log entries',
  );
};

const extractPlayerJoinInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerJoinLog => {
  const regex =
    /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}).*\[Behaviour\] OnPlayerJoined (\S+)/;
  const matches = logLine.value.match(regex);

  if (!matches) {
    throw new Error('Log line did not match the expected format');
  }

  const [date, time, playerName] = matches.slice(1);
  const joinDateTime = datefns.parse(
    `${date} ${time}`,
    'yyyy.MM.dd HH:mm:ss',
    new Date(),
  );

  return {
    logType: 'playerJoin',
    joinDate: joinDateTime,
    playerName,
  };
};

export const getLogStoreFilePath = (): VRChatLogStoreFilePath => {
  const userDataPath = getAppUserDataPath();
  return VRChatLogStoreFilePathSchema.parse(
    path.join(userDataPath, 'logStore', 'logStore.txt'),
  );
};

/**
 * 必要になるlog行を app 内のファイルに保存しておく
 * 最後に保存した日時以降のログ行のみを日付順に保存する
 * 最初は全部保存しようとして被ってたら辞めるでもいいかな
 */
export const appendLoglinesToFile = async (props: {
  logLines: VRChatLogLine[];
  logStoreFilePath: VRChatLogStoreFilePath;
}): Promise<neverthrow.Result<void, Error>> => {
  const isExists = await fs.existsSyncSafe(props.logStoreFilePath.value);
  if (isExists.isErr()) {
    return neverthrow.err(
      match(isExists.error)
        .with(P.instanceOf(Error), () => isExists.error)
        .exhaustive(),
    );
  }
  // ファイルが存在しない場合は新規作成
  if (!isExists.value) {
    const mkdirResult = await fs.mkdirSyncSafe(
      path.dirname(props.logStoreFilePath.value),
    );
    if (mkdirResult.isErr()) {
      const error = match(mkdirResult.error)
        .with({ code: 'EEXIST' }, () => null)
        .otherwise(() => mkdirResult.error);
      if (error) {
        return neverthrow.err(error.error);
      }
    }
  }

  const existingLogsResult = await fs.readFileSyncSafe(
    props.logStoreFilePath.value,
  );
  let existingLogs: string;
  if (existingLogsResult.isErr()) {
    const error = match(existingLogsResult.error)
      .with({ code: 'ENOENT' }, () => null)
      .with({ code: P.string }, (ee) => ee)
      .exhaustive();
    if (error) {
      return neverthrow.err(error.error);
    }
    existingLogs = '';
  } else {
    existingLogs = existingLogsResult.value.toString();
  }
  // 既存のログ行と重複している行は追加しない
  const existingLines = existingLogs.split('\n');
  const newLines = props.logLines.filter(
    (line) => !existingLines.includes(line.value),
  );
  if (newLines.length === 0) {
    return neverthrow.ok(undefined);
  }
  // 最終行には改行を追加
  const newLog = `${newLines.join('\n')}\n`;
  const writeResult = await fs.appendFileAsync(
    props.logStoreFilePath.value,
    newLog,
  );
  if (writeResult.isErr()) {
    const error = match(writeResult.error)
      .with({ code: 'ENOENT' }, () => new Error('appendFileAsync ENOENT'))
      .exhaustive();
    if (error) {
      return neverthrow.err(error);
    }
  }
  return neverthrow.ok(undefined);
};
