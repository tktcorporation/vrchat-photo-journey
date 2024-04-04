import * as datefns from 'date-fns';
import path from 'node:path';
import readline from 'node:readline';
import * as log from 'electron-log';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as fs from '../lib/wrappedFs'
// import VRChatLogFileError from './error';
// import type * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import * as z from 'zod';

import * as vrchatLogFileDirService from '../vrchatLogFileDir/service';
import { VRChatLogFilePath, VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import { VRChatLogFileError } from './error';


type WorldId = `wrld_${string}`;
interface VRChatWorldJoinLog {
  joinDate: Date;
  worldId: WorldId;
  worldInstanceId: string;
  worldName: string;
}
export const getVRChatWorldJoinLogFromLogPath = async (
  logFilesDir: VRChatLogFilesDirPath
): Promise<neverthrow.Result<VRChatWorldJoinLog[], VRChatLogFileError>> => {
  const logFilePathList = vrchatLogFileDirService.getVRChatLogFilePathList(logFilesDir);
  if (logFilePathList.isErr()) {
    return neverthrow.err(match(logFilePathList.error)
      .with('ENOENT', () => new VRChatLogFileError('LOG_FILE_DIR_NOT_FOUND')).exhaustive())
  }

  const worldJoinLogInfoList: VRChatWorldJoinLog[] = [];
  const errors: VRChatLogFileError[] = [];
  await Promise.all(
    logFilePathList.value.map(async (logFilePath) => {
      const result = await getLogLinesFromLogFileName({ logFilePath });
      if (result.isErr()) {
        errors.push(result.error);
        return;
      }
      const worldJoinLogInfos = convertLogLinesToWorldJoinLogInfos(result.value);
      worldJoinLogInfoList.push(...worldJoinLogInfos);
    }),
  );

  if (errors.length > 0) {
    return neverthrow.err(errors[0]);
  }

  return neverthrow.ok(worldJoinLogInfoList);
}


const validateWorldId = (value: string): value is WorldId => {
  const regex = /^wrld_[a-f0-9-]+$/;
  return regex.test(value);
};

// TODO: Join 以外も取る
const getLogLinesFromLogFileName = async (props: {
  logFilePath: VRChatLogFilePath;
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  const stream = fs.createReadStream(props.logFilePath.value);
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
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
  vrChatLogFilesDirPath: VRChatLogFilesDirPath;
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  const vrchatLogFilePathList = vrchatLogFileDirService.getVRChatLogFilePathList(
    props.vrChatLogFilesDirPath
  );
  if (vrchatLogFilePathList.isErr()) {
    return neverthrow.err(vrchatLogFilePathList.error);
  }

  const logLines: string[] = [];
  const errors: VRChatLogFileError[] = [];
  await Promise.all(
    vrchatLogFilePathList.value.map(async (filePath) => {
      const result = await getLogLinesFromLogFileName({
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


// TODO: or プレイヤーのjoin情報がとれそうなところ
const extractWorldJoinInfoFromLogs = (
  logLines: string[],
  index: number,
): VRChatWorldJoinLog | null => {
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
    const joinDate = datefns.parse(
      `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date(),
    );
    return {
      joinDate,
      worldInstanceId: '',
      worldId,
      worldName: foundWorldName,
    };
  }

  throw new Error(
    'Failed to extract world name from the subsequent log entries',
  );
};

// TODO: joinlog をアプリ内の何処かのファイルに書き込む処理
const writeLogToFile = () => {}

const convertLogLinesToWorldJoinLogInfos = (
  logLines: string[],
): VRChatWorldJoinLog[] => {
  const worldJoinLogInfos: VRChatWorldJoinLog[] = [];
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




const removeAdjacentDuplicateWorldEntries = (
  worldJoinLogInfoList: VRChatWorldJoinLog[],
): VRChatWorldJoinLog[] => {
  worldJoinLogInfoList.sort((a, b) => {
    return datefns.compareAsc(
      a.joinDate,
      b.joinDate,
    );
  });

  // 隣接する重複を削除
  let previousWorldId: string | null = null;
  return worldJoinLogInfoList.filter((info, index) => {
    if (index === 0 || info.worldId !== previousWorldId) {
      previousWorldId = info.worldId;
      return true;
    }
    return false;
  });
};

export { removeAdjacentDuplicateWorldEntries };
