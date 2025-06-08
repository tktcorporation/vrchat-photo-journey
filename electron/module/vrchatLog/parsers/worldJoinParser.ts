import type { VRChatLogLine } from '../model';
import { isValidWorldId, parseLogDateTime } from './baseParser';

type WorldId = `wrld_${string}`;

export interface VRChatWorldJoinLog {
  logType: 'worldJoin';
  joinDate: Date;
  worldId: WorldId;
  worldInstanceId: string;
  worldName: string;
}

/**
 * ワールド参加ログのパース機能
 */

/**
 * ログエントリーからワールド参加情報を抽出
 * @param logLines ログ行の配列
 * @param index 現在処理中のログ行のインデックス
 * @returns ワールド参加情報、または抽出できない場合null
 */
export const extractWorldJoinInfoFromLogs = (
  logLines: VRChatLogLine[],
  index: number,
): VRChatWorldJoinLog | null => {
  const logEntry = logLines[index];
  const regex =
    /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}) .* \[Behaviour\] Joining (wrld_[a-f0-9-]+):(.*)/;
  const matches = logEntry.value.match(regex);

  if (!matches || matches.length < 4) {
    return null;
  }

  const date = matches[1];
  const time = matches[2];
  const worldId = matches[3];
  const instanceId = matches[4];

  if (!isValidWorldId(worldId)) {
    throw new Error('WorldId did not match the expected format');
  }

  let foundWorldName: string | null = null;

  // 後続のログ行からワールド名を抽出
  for (const l of logLines.slice(index + 1)) {
    const worldNameRegex = /\[Behaviour\] Joining or Creating Room: (.+)/;
    const [, worldName] = l.value.match(worldNameRegex) || [];
    if (worldName && !foundWorldName) {
      foundWorldName = worldName;
    }
  }

  if (foundWorldName) {
    const joinDate = parseLogDateTime(date, time);
    return {
      logType: 'worldJoin',
      joinDate,
      worldInstanceId: instanceId,
      worldId: worldId as `wrld_${string}`,
      worldName: foundWorldName,
    };
  }

  throw new Error(
    'Failed to extract world name from the subsequent log entries',
  );
};
