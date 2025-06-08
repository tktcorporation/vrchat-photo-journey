import * as datefns from 'date-fns';
import type { VRChatLogLine } from '../model';

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

/**
 * プレイヤーアクション（参加・退出）ログのパース機能
 */

/**
 * プレイヤー参加ログから情報を抽出
 * @param logLine プレイヤー参加のログ行
 * @returns プレイヤー参加情報
 * @throws ログ行が期待される形式と一致しない場合
 */
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

/**
 * プレイヤー退出ログから情報を抽出
 * @param logLine プレイヤー退出のログ行
 * @returns プレイヤー退出情報
 * @throws ログ行が期待される形式と一致しない場合
 */
export const extractPlayerLeaveInfoFromLog = (
  logLine: VRChatLogLine,
): VRChatPlayerLeaveLog => {
  // プレイヤー名は空白を含む場合がある
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
