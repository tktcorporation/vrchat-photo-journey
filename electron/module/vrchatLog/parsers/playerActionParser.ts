import * as datefns from 'date-fns';
import type { VRChatLogLine, VRChatPlayerId, VRChatPlayerName } from '../model';
import { OptionalVRChatPlayerIdSchema, VRChatPlayerNameSchema } from '../model';

export interface VRChatPlayerJoinLog {
  logType: 'playerJoin';
  joinDate: Date;
  playerName: VRChatPlayerName;
  playerId: VRChatPlayerId | null;
}

export interface VRChatPlayerLeaveLog {
  logType: 'playerLeave';
  leaveDate: Date;
  playerName: VRChatPlayerName;
  playerId: VRChatPlayerId | null;
}

export type VRChatPlayerActionLog = VRChatPlayerJoinLog | VRChatPlayerLeaveLog;

export type PlayerActionType = 'join' | 'leave';

/**
 * プレイヤーアクション（参加・退出）ログのパース機能
 */

/**
 * プレイヤーアクション（参加・退出）ログから情報を抽出する汎用関数
 * @param logLine ログ行
 * @param actionType アクションタイプ（'join' または 'leave'）
 * @returns プレイヤーアクション情報
 * @throws ログ行が期待される形式と一致しない場合
 */
export const extractPlayerActionFromLog = <T extends PlayerActionType>(
  logLine: VRChatLogLine,
  actionType: T,
): T extends 'join' ? VRChatPlayerJoinLog : VRChatPlayerLeaveLog => {
  // アクションタイプに応じた正規表現とイベント名を定義
  type PatternConfig = {
    regex: RegExp;
    dateFormat: string;
    processDate?: (date: string) => string;
  };

  const patterns: Record<PlayerActionType, PatternConfig> = {
    join: {
      // 2025.01.07 23:25:34 Log        -  [Behaviour] OnPlayerJoined プレイヤーA (usr_8862b082-dbc8-4b6d-8803-e834f833b498)
      regex:
        /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}).*\[Behaviour\] OnPlayerJoined (.+?)(?:\s+\((usr_[^)]+)\))?$/,
      dateFormat: 'yyyy.MM.dd HH:mm:ss',
    },
    leave: {
      // プレイヤー名は空白を含む場合がある
      // 2025.01.08 00:22:04 Log        -  [Behaviour] OnPlayerLeft プレイヤー ⁄ A (usr_34a27988-a7e4-4d5e-a49a-ae5975422779)
      // 2025.02.22 21:14:48 Debug      -  [Behaviour] OnPlayerLeft tkt (usr_3ba2a992-724c-4463-bc75-7e9f6674e8e0)
      regex:
        /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2}:\d{2})\s+\S+\s+-\s+\[Behaviour\] OnPlayerLeft (.+?)(?:\s+\((usr_[^)]+)\))?$/,
      dateFormat: 'yyyy-MM-dd HH:mm:ss',
      processDate: (date: string) => date.replace(/\./g, '-'),
    },
  };

  const pattern = patterns[actionType];
  const matches = logLine.value.match(pattern.regex);

  if (!matches) {
    throw new Error(
      `Log line did not match the expected format for ${actionType}: ${logLine.value}`,
    );
  }

  const [, date, time, playerName, playerId] = matches;
  const processedDate = pattern.processDate ? pattern.processDate(date) : date;
  const actionDateTime = datefns.parse(
    `${processedDate} ${time}`,
    pattern.dateFormat,
    new Date(),
  );

  // valueObjectsを使用して型安全に検証
  const validatedPlayerName = VRChatPlayerNameSchema.parse(playerName);
  const validatedPlayerId = OptionalVRChatPlayerIdSchema.parse(
    playerId || null,
  );

  // アクションタイプに応じた結果を返す
  const baseResult = {
    playerName: validatedPlayerName,
    playerId: validatedPlayerId,
  };

  if (actionType === 'join') {
    return {
      logType: 'playerJoin',
      joinDate: actionDateTime,
      ...baseResult,
    } as T extends 'join' ? VRChatPlayerJoinLog : VRChatPlayerLeaveLog;
  }
  return {
    logType: 'playerLeave',
    leaveDate: actionDateTime,
    ...baseResult,
  } as T extends 'join' ? VRChatPlayerJoinLog : VRChatPlayerLeaveLog;
};

/**
 * プレイヤー参加ログから情報を抽出
 * @param logLine プレイヤー参加のログ行
 * @returns プレイヤー参加情報
 * @throws ログ行が期待される形式と一致しない場合
 */
export const extractPlayerJoinInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerJoinLog => {
  return extractPlayerActionFromLog(logLine, 'join');
};

/**
 * プレイヤー退出ログから情報を抽出
 * @param logLine プレイヤー退出のログ行
 * @returns プレイヤー退出情報
 * @throws ログ行が期待される形式と一致しない場合
 */
export const extractPlayerLeaveInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerLeaveLog => {
  return extractPlayerActionFromLog(logLine, 'leave');
};
