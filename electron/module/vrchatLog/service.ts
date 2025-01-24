import readline from 'node:readline';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as fs from '../../lib/wrappedFs';

import path from 'node:path';
import { getAppUserDataPath } from '../../lib/wrappedApp';
import type {
  VRChatLogFilePath,
  VRChatLogFilesDirPath,
} from '../vrchatLogFileDir/model';
import * as vrchatLogFileDirService from '../vrchatLogFileDir/service';
import type { VRChatPhotoDirPath } from '../vrchatPhoto/valueObjects';
import { createVRChatWorldJoinLogFromPhoto } from '../vrchatWorldJoinLogFromPhoto/service';
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
  playerId: string | null;
}
export interface VRChatPlayerLeaveLog {
  logType: 'playerLeave';
  leaveDate: Date;
  playerName: string;
  playerId: string | null;
}

export const getVRChaLogInfoFromLogPath = async (
  logFilesDir: VRChatLogFilesDirPath,
): Promise<
  neverthrow.Result<
    (VRChatWorldJoinLog | VRChatPlayerJoinLog | VRChatPlayerLeaveLog)[],
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
    (VRChatWorldJoinLog | VRChatPlayerJoinLog | VRChatPlayerLeaveLog)[],
    VRChatLogFileError
  >
> => {
  const logLineList = await getLogLinesByLogFilePathList({
    logFilePathList,
    includesList: [
      'VRC Analytics Initialized',
      '[Behaviour] OnPlayerJoinComplete',
      '[Behaviour] Joining ',
      '[Behaviour] OnPlayerJoined ',
      '[Behaviour] OnPlayerLeft ',
      'VRCApplication: HandleApplicationQuit',
    ],
  });
  if (logLineList.isErr()) {
    return neverthrow.err(logLineList.error);
  }

  const logInfoList: (
    | VRChatWorldJoinLog
    | VRChatPlayerJoinLog
    | VRChatPlayerLeaveLog
  )[] = convertLogLinesToWorldAndPlayerJoinLogInfos(logLineList.value);

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
): (VRChatWorldJoinLog | VRChatPlayerJoinLog | VRChatPlayerLeaveLog)[] => {
  const logInfos: (
    | VRChatWorldJoinLog
    | VRChatPlayerJoinLog
    | VRChatPlayerLeaveLog
  )[] = [];
  for (const [index, l] of logLines.entries()) {
    if (l.value.includes('Joining wrld')) {
      const info = extractWorldJoinInfoFromLogs(logLines, index);
      if (info) {
        logInfos.push(info);
      }
    }
    if (l.value.includes('[Behaviour] OnPlayerJoined')) {
      const info = extractPlayerJoinInfoFromLog(l);
      if (info) {
        logInfos.push(info);
      }
    }
    if (
      l.value.includes('OnPlayerLeft') &&
      !l.value.includes('OnPlayerLeftRoom')
    ) {
      const info = extractPlayerLeaveInfoFromLog(l);
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

export const extractPlayerJoinInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerJoinLog => {
  // 2025.01.07 23:25:34 Log        -  [Behaviour] OnPlayerJoined プレイヤーA (usr_8862b082-dbc8-4b6d-8803-e834f833b498)
  const regex =
    /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}).*\[Behaviour\] OnPlayerJoined (.+?)(?:\s+\((usr_[^)]+)\))?$/;
  const matches = logLine.value.match(regex);

  if (!matches) {
    throw new Error('Log line did not match the expected format');
  }

  const [date, time, playerName, playerId] = matches.slice(1);
  const joinDateTime = datefns.parse(
    `${date} ${time}`,
    'yyyy.MM.dd HH:mm:ss',
    new Date(),
  );

  return {
    logType: 'playerJoin',
    joinDate: joinDateTime,
    playerName,
    playerId: playerId || null,
  };
};

const extractPlayerLeaveInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerLeaveLog => {
  // 下記のように、プレイヤー名は空白を含む場合がある
  // 2025.01.08 00:22:04 Log        -  [Behaviour] OnPlayerLeft プレイヤー ⁄ A (usr_34a27988-a7e4-4d5e-a49a-ae5975422779)
  const regex =
    /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2}:\d{2})\s+Log\s+-\s+\[Behaviour\] OnPlayerLeft (.+?)(?:\s+\((usr_[^)]+)\))?$/;
  const matches = logLine.value.match(regex);
  if (!matches) {
    throw new Error(
      `Log line did not match the expected format: ${logLine.value}`,
    );
  }

  const [, date, time, playerName, playerId] = matches;
  const leaveDateTime = datefns.parse(
    `${date.replace(/\./g, '-')} ${time}`,
    'yyyy-MM-dd HH:mm:ss',
    new Date(),
  );

  return {
    logType: 'playerLeave',
    leaveDate: leaveDateTime,
    playerName,
    playerId: playerId || null,
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

  // ファイルが存在しない場合は新規作成
  if (!isExists) {
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
    // 新規ファイルの場合は直接書き込み
    const newLog = `${props.logLines.map((l) => l.value).join('\n')}\n`;
    const writeResult = await fs.writeFileSyncSafe(
      props.logStoreFilePath.value,
      newLog,
    );
    if (writeResult.isErr()) {
      return neverthrow.err(new Error('ログファイルの作成に失敗しました'));
    }
    return neverthrow.ok(undefined);
  }

  // 既存のログ行をSetとして保持
  const existingLines = new Set<string>();

  try {
    const stream = fs.createReadStream(props.logStoreFilePath.value);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    // ストリームでログを読み込み
    for await (const line of rl) {
      if (line.trim()) {
        // 空行をスキップ
        existingLines.add(line);
      }
    }

    // 重複していない新しいログ行のみをフィルタリング
    const newLines = props.logLines.filter(
      (line) => !existingLines.has(line.value),
    );

    if (newLines.length === 0) {
      return neverthrow.ok(undefined);
    }

    // 新しいログ行を追加
    const newLog = `${newLines.map((l) => l.value).join('\n')}\n`;
    const appendResult = await fs.appendFileAsync(
      props.logStoreFilePath.value,
      newLog,
    );

    if (appendResult.isErr()) {
      const error = match(appendResult.error)
        .with(
          { code: 'ENOENT' },
          () => new Error('ログファイルが見つかりません'),
        )
        .otherwise(
          (e: { message?: string }) =>
            new Error(
              `ログの追記に失敗しました: ${e.message || '不明なエラー'}`,
            ),
        );
      return neverthrow.err(error);
    }

    return neverthrow.ok(undefined);
  } catch (err) {
    const error = err as Error;
    return neverthrow.err(
      new Error(`ログファイルの処理中にエラーが発生しました: ${error.message}`),
    );
  }
};

import { glob } from 'glob';
import type { VRChatWorldJoinLogFromPhoto } from '../vrchatWorldJoinLogFromPhoto/vrchatWorldJoinLogFromPhoto.model';
/**
 * 旧Appで生成したログファイル(写真)をインポートする
 *
 * 写真のあるディレクトリに 下記の形式で保存されているので、parse して
 * `VRChat_2025-01-06_23-18-51.000_wrld_f5db5fd3-7541-407e-a218-04fbdd84f2b7.jpeg`
 * r/VRChat_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}.[0-9]{3}_wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.[a-z]{3}
 *
 * VRChatWorldJoinLog に変換して返す
 */
export const getLogLinesFromLogPhotoDirPath = async ({
  vrChatPhotoDirPath,
}: { vrChatPhotoDirPath: VRChatPhotoDirPath }): Promise<
  VRChatWorldJoinLogFromPhoto[]
> => {
  const globPath = path.posix.join(
    vrChatPhotoDirPath.value,
    '**',
    'VRChat_*_wrld_*',
  );
  // 正規表現にマッチするファイルを再起的に取得していく
  const logPhotoFilePathList = await glob(globPath);

  // r/VRChat_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}.[0-9]{3}_wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.[a-z]
  // を parse して VRChatWorldJoinLog に変換する
  const worldJoinLogList = logPhotoFilePathList
    .map((filePath) => {
      const regex =
        /VRChat_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3})_wrld_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[a-z]+/;
      const matches = filePath.match(regex);
      if (!matches) {
        return null;
      }
      return {
        // ファイル名の日時はlocal time なので、そのままparseする
        joinDate: datefns.parse(
          matches[1],
          'yyyy-MM-dd_HH-mm-ss.SSS',
          new Date(),
        ),
        worldId: `wrld_${matches[2]}` as WorldId,
      };
    })
    .filter((log) => log !== null);
  return worldJoinLogList;
};

/**
 * 写真として保存されているワールドへのJoinログをデータベースに保存する
 */
export const importLogLinesFromLogPhotoDirPath = async ({
  vrChatPhotoDirPath,
}: { vrChatPhotoDirPath: VRChatPhotoDirPath }): Promise<void> => {
  const logLines = await getLogLinesFromLogPhotoDirPath({
    vrChatPhotoDirPath,
  });

  const worldJoinLogs: VRChatWorldJoinLogFromPhoto[] = logLines.map((log) => ({
    joinDate: log.joinDate,
    worldId: log.worldId,
  }));

  await createVRChatWorldJoinLogFromPhoto(worldJoinLogs);
};
