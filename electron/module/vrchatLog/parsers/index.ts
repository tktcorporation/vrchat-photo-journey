import type { VRChatLogLine } from '../model';
import {
  extractPlayerJoinInfoFromLog,
  extractPlayerLeaveInfoFromLog,
  type VRChatPlayerJoinLog,
  type VRChatPlayerLeaveLog,
} from './playerActionParser';
import {
  extractWorldJoinInfoFromLogs,
  type VRChatWorldJoinLog,
} from './worldJoinParser';
import {
  extractWorldLeaveInfoFromLog,
  inferWorldLeaveEvents,
  type VRChatWorldLeaveLog,
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
  // TODO: アプリイベントの処理は今後実装
  // | VRChatAppStartLog
  // | VRChatAppExitLog
  const logInfos: (
    | VRChatWorldJoinLog
    | VRChatWorldLeaveLog
    | VRChatPlayerJoinLog
    | VRChatPlayerLeaveLog
  )[] =
    // TODO: アプリイベントの処理は今後実装
    // | VRChatAppStartLog
    // | VRChatAppExitLog
    [];

  const worldJoinIndices: number[] = [];

  for (const [index, l] of logLines.entries()) {
    // TODO: アプリイベントの処理は今後実装
    // // アプリ開始ログ (VRC Analytics Initialized)
    // const appStartInfo = extractAppStartInfoFromLog(l);
    // if (appStartInfo) {
    //   logInfos.push(appStartInfo);
    // }

    // アプリ終了ログ (VRCApplication: HandleApplicationQuit)
    // このパターンはworldLeaveParserで処理される
    // const appExitInfo = extractAppExitInfoFromLog(l);
    // if (appExitInfo) {
    //   logInfos.push(appExitInfo);
    // }

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

// TODO: アプリイベントのパーサーは今後実装
// export {
//   extractAppStartInfoFromLog,
//   extractAppExitInfoFromLog,
//   extractAppVersionInfoFromLog,
// } from './appEventParser';
export { filterLogLinesByDate } from './baseParser';
export type {
  VRChatPlayerJoinLog,
  VRChatPlayerLeaveLog,
} from './playerActionParser';
export {
  extractPlayerJoinInfoFromLog,
  extractPlayerLeaveInfoFromLog,
} from './playerActionParser';
// 型定義の再エクスポート
export type { VRChatWorldJoinLog } from './worldJoinParser';
// 個別のパーサー関数も再エクスポート
export { extractWorldJoinInfoFromLogs } from './worldJoinParser';
export type { VRChatWorldLeaveLog } from './worldLeaveParser';
export {
  extractWorldLeaveInfoFromLog,
  inferWorldLeaveEvents,
} from './worldLeaveParser';
