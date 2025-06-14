import * as datefns from 'date-fns';
import type { VRChatLogLine } from '../model';
import { VRChatLogLineSchema } from '../model';

/**
 * DBレコードをlogStore形式に逆変換するモジュール
 */

// DBレコードの型定義
export interface DBLogRecord {
  id: string;
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerJoinLogRecord {
  id: string;
  playerName: string;
  playerId: string | null;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerLeaveLogRecord {
  id: string;
  playerName: string;
  playerId: string | null;
  leaveDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  outputPath?: string;
}

export interface LogRecord {
  type: 'worldJoin' | 'playerJoin' | 'playerLeave';
  record: DBLogRecord | PlayerJoinLogRecord | PlayerLeaveLogRecord;
}

/**
 * 日付を logStore 形式（YYYY.MM.DD HH:mm:ss）にフォーマット
 */
const formatLogDateTime = (date: Date): string => {
  return datefns.format(date, 'yyyy.MM.dd HH:mm:ss');
};

/**
 * ワールド参加ログをlogStore形式のログ行に変換
 * @param worldJoinLog ワールド参加ログのDBレコード
 * @returns logStore形式のログ行配列（2行：参加行とルーム作成行）
 */
export const convertWorldJoinLogToLogLines = (
  worldJoinLog: DBLogRecord,
): VRChatLogLine[] => {
  const dateTimeStr = formatLogDateTime(worldJoinLog.joinDateTime);

  const joiningLine = VRChatLogLineSchema.parse(
    `${dateTimeStr} Log        -  [Behaviour] Joining ${worldJoinLog.worldId}:${worldJoinLog.worldInstanceId}`,
  );

  const roomLine = VRChatLogLineSchema.parse(
    `${dateTimeStr} Log        -  [Behaviour] Joining or Creating Room: ${worldJoinLog.worldName}`,
  );

  return [joiningLine, roomLine];
};

/**
 * プレイヤー参加ログをlogStore形式のログ行に変換
 * @param playerJoinLog プレイヤー参加ログのDBレコード
 * @returns logStore形式のログ行
 */
export const convertPlayerJoinLogToLogLine = (
  playerJoinLog: PlayerJoinLogRecord,
): VRChatLogLine => {
  const dateTimeStr = formatLogDateTime(playerJoinLog.joinDateTime);
  const playerIdSuffix = playerJoinLog.playerId
    ? ` (${playerJoinLog.playerId})`
    : '';

  const logLine = VRChatLogLineSchema.parse(
    `${dateTimeStr} Log        -  [Behaviour] OnPlayerJoined ${playerJoinLog.playerName}${playerIdSuffix}`,
  );

  return logLine;
};

/**
 * プレイヤー退出ログをlogStore形式のログ行に変換
 * @param playerLeaveLog プレイヤー退出ログのDBレコード
 * @returns logStore形式のログ行
 */
export const convertPlayerLeaveLogToLogLine = (
  playerLeaveLog: PlayerLeaveLogRecord,
): VRChatLogLine => {
  const dateTimeStr = formatLogDateTime(playerLeaveLog.leaveDateTime);
  const playerIdSuffix = playerLeaveLog.playerId
    ? ` (${playerLeaveLog.playerId})`
    : '';

  const logLine = VRChatLogLineSchema.parse(
    `${dateTimeStr} Log        -  [Behaviour] OnPlayerLeft ${playerLeaveLog.playerName}${playerIdSuffix}`,
  );

  return logLine;
};

/**
 * 各ログレコードから対応する日時を取得
 */
const getLogDateTime = (logRecord: LogRecord): Date => {
  switch (logRecord.type) {
    case 'worldJoin':
      return (logRecord.record as DBLogRecord).joinDateTime;
    case 'playerJoin':
      return (logRecord.record as PlayerJoinLogRecord).joinDateTime;
    case 'playerLeave':
      return (logRecord.record as PlayerLeaveLogRecord).leaveDateTime;
    default:
      throw new Error(
        `Unknown log record type: ${(logRecord as LogRecord).type}`,
      );
  }
};

/**
 * 複数のDBレコードをlogStore形式に変換し、時系列順でソート
 * @param logRecords 変換対象のログレコード配列
 * @returns 時系列順にソートされたlogStore形式のログ行配列
 */
export const exportLogsToLogStore = (
  logRecords: LogRecord[],
): VRChatLogLine[] => {
  // 時系列順にソート
  const sortedRecords = [...logRecords].sort((a, b) => {
    const dateA = getLogDateTime(a);
    const dateB = getLogDateTime(b);
    return datefns.compareAsc(dateA, dateB);
  });

  const logLines: VRChatLogLine[] = [];

  for (const logRecord of sortedRecords) {
    switch (logRecord.type) {
      case 'worldJoin': {
        const worldJoinLines = convertWorldJoinLogToLogLines(
          logRecord.record as DBLogRecord,
        );
        logLines.push(...worldJoinLines);
        break;
      }
      case 'playerJoin': {
        const playerJoinLine = convertPlayerJoinLogToLogLine(
          logRecord.record as PlayerJoinLogRecord,
        );
        logLines.push(playerJoinLine);
        break;
      }
      case 'playerLeave': {
        const playerLeaveLine = convertPlayerLeaveLogToLogLine(
          logRecord.record as PlayerLeaveLogRecord,
        );
        logLines.push(playerLeaveLine);
        break;
      }
      default:
        throw new Error(
          `Unknown log record type: ${(logRecord as LogRecord).type}`,
        );
    }
  }

  return logLines;
};

/**
 * logStore形式のログ行配列を文字列に変換
 * @param logLines logStore形式のログ行配列
 * @returns 改行区切りの文字列
 */
export const formatLogStoreContent = (logLines: VRChatLogLine[]): string => {
  return logLines.map((line) => line.value).join('\n');
};
