import * as datefns from 'date-fns';
import type { VRChatLogLine } from '../model';

/**
 * VRChatログの基本的なパース機能を提供
 */

/**
 * ログ行から日付と時刻を抽出してDateオブジェクトに変換
 * @param dateStr YYYY.MM.DD形式の日付文字列
 * @param timeStr HH:mm:ss形式の時刻文字列
 * @returns パースされたDateオブジェクト
 */
export const parseLogDateTime = (dateStr: string, timeStr: string): Date => {
  const formattedDate = dateStr.replace(/\./g, '-');
  return datefns.parse(
    `${formattedDate} ${timeStr}`,
    'yyyy-MM-dd HH:mm:ss',
    new Date(),
  );
};

/**
 * ログ行の基本的な正規表現パターン
 */
export const LOG_DATE_TIME_PATTERN =
  /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2})/;

/**
 * ワールドIDの検証
 * @param value 検証する文字列
 * @returns ワールドIDとして有効な場合true
 */
export const isValidWorldId = (value: string): boolean => {
  const regex =
    /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return regex.test(value);
};

/**
 * プレイヤーIDの検証
 * @param value 検証する文字列
 * @returns プレイヤーIDとして有効な場合true
 */
export const isValidPlayerId = (value: string): boolean => {
  const regex =
    /^usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return regex.test(value);
};

/**
 * ログ行を日付でフィルタリング
 * @param logLines フィルタリング対象のログ行
 * @param startDate この日付以降のログを含む
 * @returns フィルタリングされたログ行
 */
export const filterLogLinesByDate = (
  logLines: VRChatLogLine[],
  startDate: Date,
): VRChatLogLine[] => {
  return logLines.filter((logLine) => {
    const dateTimeMatch = logLine.value.match(
      /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
    );
    if (!dateTimeMatch) return false;

    const [, year, month, day, hour, minute, second] = dateTimeMatch;
    const logDate = datefns.parse(
      `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date(),
    );

    if (!datefns.isValid(logDate)) {
      return false;
    }

    return (
      datefns.isAfter(logDate, startDate) || datefns.isEqual(logDate, startDate)
    );
  });
};
