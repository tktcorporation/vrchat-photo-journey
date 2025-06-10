import type { VRChatLogLine } from '../model';
import {
  type VRChatPlayerJoinLog,
  type VRChatPlayerLeaveLog,
  extractPlayerJoinInfoFromLog,
  extractPlayerLeaveInfoFromLog,
} from './playerActionParser';
import {
  type VRChatWorldJoinLog,
  extractWorldJoinInfoFromLogs,
} from './worldJoinParser';
import {
  type VRChatWorldLeaveLog,
  extractWorldLeaveInfoFromLog,
  inferWorldLeaveEvents,
} from './worldLeaveParser';

/**
 * VRChatログのパース機能をまとめたモジュール
 */

/**
 * ログ行の配列をワールド参加・退出・プレイヤー参加/退出情報に変換
 * @param logLines パース対象のログ行
 * @returns 抽出されたログ情報の配列
 */
export const convertLogLinesToWorldAndPlayerJoinLogInfos = (
  logLines: VRChatLogLine[],
): (
  | VRChatWorldJoinLog
  | VRChatWorldLeaveLog
  | VRChatPlayerJoinLog
  | VRChatPlayerLeaveLog
)[] => {
  const logInfos: (
    | VRChatWorldJoinLog
    | VRChatWorldLeaveLog
    | VRChatPlayerJoinLog
    | VRChatPlayerLeaveLog
  )[] = [];

  const worldJoinIndices: number[] = [];

  for (const [index, l] of logLines.entries()) {
    // ワールド参加ログ
    if (l.value.includes('Joining wrld_')) {
      const info = extractWorldJoinInfoFromLogs(logLines, index);
      if (info) {
        logInfos.push(info);
        worldJoinIndices.push(index);
      }
    }

    // ワールド退出ログ（明示的なパターン）
    const leaveInfo = extractWorldLeaveInfoFromLog(l);
    if (leaveInfo) {
      logInfos.push(leaveInfo);
    }

    // プレイヤー参加ログ
    if (l.value.includes('[Behaviour] OnPlayerJoined')) {
      const info = extractPlayerJoinInfoFromLog(l);
      if (info) {
        logInfos.push(info);
      }
    }

    // プレイヤー退出ログ（OnPlayerLeftRoomは除外）
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

  // 推測されたワールド退出イベントを追加
  const inferredLeaves = inferWorldLeaveEvents(logLines, worldJoinIndices);
  logInfos.push(...inferredLeaves);

  return logInfos;
};

// 型定義の再エクスポート
export type { VRChatWorldJoinLog } from './worldJoinParser';
export type { VRChatWorldLeaveLog } from './worldLeaveParser';
export type {
  VRChatPlayerJoinLog,
  VRChatPlayerLeaveLog,
} from './playerActionParser';

// 個別のパーサー関数も再エクスポート
export { extractWorldJoinInfoFromLogs } from './worldJoinParser';
export {
  extractWorldLeaveInfoFromLog,
  inferWorldLeaveEvents,
} from './worldLeaveParser';
export {
  extractPlayerJoinInfoFromLog,
  extractPlayerLeaveInfoFromLog,
} from './playerActionParser';
export { filterLogLinesByDate } from './baseParser';
