import * as nodeFs from 'node:fs';
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
  VRChatLogStoreFilePathRegex,
  VRChatLogStoreFilePathSchema,
  createTimestampedLogFilePath,
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
  // ファイルが存在するか確認
  if (!nodeFs.existsSync(props.logFilePath.value)) {
    // ファイルが存在しない場合は空の配列を返す
    return neverthrow.ok([]);
  }

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
  // 2025.02.22 21:14:48 Debug      -  [Behaviour] OnPlayerLeft tkt (usr_3ba2a992-724c-4463-bc75-7e9f6674e8e0)
  const regex =
    /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2}:\d{2})\s+\S+\s+-\s+\[Behaviour\] OnPlayerLeft (.+?)(?:\s+\((usr_[^)]+)\))?$/;
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

/**
 * logStoreディレクトリのパスを取得する
 *
 * logStoreディレクトリは、VRChatログから抽出した必要な情報のみを保存するディレクトリです。
 * これは月ごとに整理され、`logStore/YYYY-MM/logStore-YYYY-MM.txt`という形式で保存されます。
 * 月ごとのログファイルがサイズ制限（10MB）を超えると、タイムスタンプ付きの新しいファイルが作成されます。
 */
export const getLogStoreDir = (): string => {
  return path.join(getAppUserDataPath(), 'logStore');
};

/**
 * logStoreディレクトリを初期化する
 * ディレクトリが存在しない場合は作成する
 */
export const initLogStoreDir = (): void => {
  const logStoreDir = getLogStoreDir();
  if (!nodeFs.existsSync(logStoreDir)) {
    nodeFs.mkdirSync(logStoreDir, { recursive: true });
  }
};

/**
 * 指定された日付に基づいてログストアファイルのパスを生成する
 * 日付が指定されない場合は現在の日付を使用する
 */
export const getLogStoreFilePathForDate = (
  date: Date = new Date(),
): VRChatLogStoreFilePath => {
  const yearMonth = datefns.format(date, 'yyyy-MM');
  const logStoreFilePath = path.join(
    getLogStoreDir(),
    yearMonth,
    `logStore-${yearMonth}.txt`,
  );
  return VRChatLogStoreFilePathSchema.parse(logStoreFilePath);
};

/**
 * 旧形式のログファイルパスを取得する
 * ファイルが存在しない場合はnullを返す
 */
export const getLegacyLogStoreFilePath =
  async (): Promise<VRChatLogStoreFilePath | null> => {
    const legacyPath = path.join(getLogStoreDir(), 'logStore.txt');
    if (!nodeFs.existsSync(legacyPath)) {
      return null;
    }
    return VRChatLogStoreFilePathSchema.parse(legacyPath);
  };

/**
 * 指定された日付範囲のログストアファイルのパスを取得する
 * 新形式のログファイルのみ含める
 * タイムスタンプ付きの追加ファイル（logStore-YYYY-MM-YYYYMMDDHHMMSS.txt）も含める
 */
export const getLogStoreFilePathsInRange = async (
  startDate: Date,
  currentDate: Date,
): Promise<VRChatLogStoreFilePath[]> => {
  // 重複を避けるためにSetを使用
  const logFilePathSet = new Set<string>();
  let targetDate = datefns.startOfMonth(startDate);
  const endDate = datefns.endOfMonth(currentDate);

  while (
    datefns.isBefore(targetDate, endDate) ||
    datefns.isSameDay(targetDate, endDate)
  ) {
    // 標準のログファイル（月毎）を取得
    const yearMonth = datefns.format(targetDate, 'yyyy-MM');
    const monthDir = path.join(getLogStoreDir(), yearMonth);
    const standardLogFilePath = getLogStoreFilePathForDate(targetDate);

    // 標準のログファイルを追加（重複を避けるためにSetを使用）
    logFilePathSet.add(standardLogFilePath.value);

    // 同じ月のタイムスタンプ付きのログファイルを検索
    if (nodeFs.existsSync(monthDir)) {
      try {
        const files = nodeFs.readdirSync(monthDir);
        const timestampedLogFiles = files.filter((file) =>
          file.match(VRChatLogStoreFilePathRegex),
        );

        // タイムスタンプ付きのファイルをパスに追加
        for (const file of timestampedLogFiles) {
          const fullPath = path.join(monthDir, file);
          logFilePathSet.add(fullPath);
        }
      } catch (err) {
        console.error(`Error reading directory ${monthDir}:`, err);
      }
    }

    targetDate = datefns.addMonths(targetDate, 1);
  }

  // SetからVRChatLogStoreFilePathの配列に変換して返す
  return Array.from(logFilePathSet).map((p) =>
    VRChatLogStoreFilePathSchema.parse(p),
  );
};

/**
 * 必要になるlog行を app 内のファイルに保存しておく
 * 最後に保存した日時以降のログ行のみを日付順に保存する
 * 最初は全部保存しようとして被ってたら辞めるでもいいかな
 * ログの日付に基づいて適切な月のファイルに書き込む
 */
export const appendLoglinesToFile = async (props: {
  logLines: VRChatLogLine[];
  logStoreFilePath?: VRChatLogStoreFilePath; // オプショナルに変更
}): Promise<neverthrow.Result<void, never>> => {
  // ログが空の場合は何もしない
  if (props.logLines.length === 0) {
    return neverthrow.ok(undefined);
  }
  // ログを日付ごとにグループ化
  const logsByMonth = new Map<string, VRChatLogLine[]>();

  for (const logLine of props.logLines) {
    // ログから日付を抽出
    const dateMatch = logLine.value.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (!dateMatch) {
      // 日付が抽出できない場合は現在の月に追加
      const key = datefns.format(new Date(), 'yyyy-MM');
      const monthLogs = logsByMonth.get(key) || [];
      monthLogs.push(logLine);
      logsByMonth.set(key, monthLogs);
      continue;
    }

    const year = dateMatch[1];
    const month = dateMatch[2];
    const key = `${year}-${month}`;

    const monthLogs = logsByMonth.get(key) || [];
    monthLogs.push(logLine);
    logsByMonth.set(key, monthLogs);
  }

  // 各月のログを対応するファイルに書き込む
  for (const [yearMonth, logs] of logsByMonth.entries()) {
    const [year, month] = yearMonth.split('-');
    const date = datefns.parse(`${year}-${month}-01`, 'yyyy-MM-dd', new Date());

    // 月別のディレクトリを作成
    const monthDir = path.join(getLogStoreDir(), yearMonth);

    // ログストアのルートディレクトリを先に確認・作成
    const logStoreDir = getLogStoreDir();
    if (!nodeFs.existsSync(logStoreDir)) {
      nodeFs.mkdirSync(logStoreDir, { recursive: true });
    }

    // 月別ディレクトリを作成
    if (!nodeFs.existsSync(monthDir)) {
      nodeFs.mkdirSync(monthDir, { recursive: true });
    }

    const logStoreFilePath = getLogStoreFilePathForDate(date);
    const isExists = await fs.existsSyncSafe(logStoreFilePath.value);

    // ファイルサイズをチェック
    if (isExists) {
      const stats = nodeFs.statSync(logStoreFilePath.value);
      if (stats.size >= 10 * 1024 * 1024) {
        // 10MB
        // ファイルサイズが上限を超えている場合は、新しいファイルを作成
        const timestamp = new Date();
        const newFilePath = createTimestampedLogFilePath(
          monthDir,
          yearMonth,
          timestamp,
        );

        // 新しいファイルに直接書き込み
        const newLog = `${logs.map((l) => l.value).join('\n')}\n`;
        const writeResult = await fs.writeFileSyncSafe(newFilePath, newLog);
        if (writeResult.isErr()) {
          throw writeResult.error;
        }
        continue;
      }
    }

    // 既存のログ行をSetとして保持
    const existingLines = new Set<string>();

    if (isExists) {
      const readResult = await fs.readFileSyncSafe(logStoreFilePath.value);
      if (readResult.isOk()) {
        const content = readResult.value.toString();
        for (const line of content.split('\n')) {
          if (line) {
            existingLines.add(line);
          }
        }
      }
    }

    // 重複を除外して新しいログ行を追加
    const newLines = logs.filter((log) => !existingLines.has(log.value));
    if (newLines.length === 0) {
      continue;
    }

    const newLog = `${newLines.map((l) => l.value).join('\n')}\n`;
    const writeResult = await fs.writeFileSyncSafe(
      logStoreFilePath.value,
      newLog,
    );
    if (writeResult.isErr()) {
      throw writeResult.error;
    }
  }

  return neverthrow.ok(undefined);
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

/**
 * ログ行を日付でフィルタリングする
 * 指定された日付以降のログ行のみを返す
 *
 * @param logLines フィルタリング対象のログ行の配列
 * @param startDate フィルタリングの基準となる日付（この日付以降のログを含む）
 * @returns フィルタリングされたログ行の配列
 */
export const filterLogLinesByDate = (
  logLines: VRChatLogLine[],
  startDate: Date,
): VRChatLogLine[] => {
  return logLines.filter((logLine) => {
    // ログから日付と時刻を抽出
    const dateTimeMatch = logLine.value.match(
      /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
    );
    if (!dateTimeMatch) return false;

    const [, year, month, day, hour, minute, second] = dateTimeMatch;
    // datefnsを使用して日付をパース - フォーマットを明示的に指定
    const logDate = datefns.parse(
      `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date(),
    );

    // 日付パースの失敗をチェック
    if (!datefns.isValid(logDate)) {
      return false;
    }

    // 指定された日付以降のみを含める
    return (
      datefns.isAfter(logDate, startDate) || datefns.isEqual(logDate, startDate)
    );
  });
};
