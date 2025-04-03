const opaqueSymbol: unique symbol = Symbol('opaqueSymbol');

import * as datefns from 'date-fns';
import { z } from 'zod';

export abstract class BaseValueObject<T extends string, K> {
  // @ts-ignore TS1338
  private readonly [opaqueSymbol]: T;
  readonly value: K;

  constructor(value: K) {
    this.value = value;
  }

  equals(other: BaseValueObject<T, K>): boolean {
    return this === other || this.value === other.value;
  }
}

/**
 * VRChatのログ行
 */
class VRChatLogLine extends BaseValueObject<'VRChatLogLine', string> {}

/**
 * VRChatのログ行の保存先（標準形式）
 * 例: logStore-2024-05.txt
 */
class VRChatLogStoreFilePath extends BaseValueObject<
  'VRChatLogStoreFilePath',
  string
> {
  /**
   * ファイルパスから年月を取得する
   * @returns yyyy-MM形式の文字列、または取得できない場合はnull
   */
  public getYearMonth(): string | null {
    // レガシーファイルの場合はnullを返す
    if (
      this.value.endsWith('/logStore.txt') ||
      this.value.endsWith('\\logStore.txt')
    ) {
      return null;
    }

    const match = this.value.match(/logStore-(\d{4}-\d{2})(?:-\d{14})?\.txt$/);
    return match ? match[1] : null;
  }

  /**
   * タイムスタンプ付きのログファイルかどうかを判定する
   */
  public hasTimestamp(): boolean {
    return /logStore-\d{4}-\d{2}-\d{14}\.txt$/.test(this.value);
  }

  /**
   * タイムスタンプを取得する（タイムスタンプがない場合はnull）
   */
  public getTimestamp(): Date | null {
    const match = this.value.match(/logStore-\d{4}-\d{2}-(\d{14})\.txt$/);
    if (!match) return null;

    return datefns.parse(match[1], 'yyyyMMddHHmmss', new Date());
  }
}

/**
 * タイムスタンプ付きのログファイルパスを作成する
 * @param yearMonth yyyy-MM形式の文字列
 * @param timestamp タイムスタンプ（省略時は現在時刻）
 * @returns ファイルパス文字列
 */
export const createTimestampedLogFilePath = (
  basePath: string,
  yearMonth: string,
  timestamp: Date = new Date(),
): string => {
  const timestampStr = datefns.format(timestamp, 'yyyyMMddHHmmss');
  return `${basePath}/logStore-${yearMonth}-${timestampStr}.txt`;
};

export type { VRChatLogLine, VRChatLogStoreFilePath };

export const VRChatLogLineSchema = z.string().transform((value) => {
  return new VRChatLogLine(value);
});

export const VRChatLogStoreFilePathRegex =
  /(logStore-\d{4}-\d{2}(?:-\d{14})?\.txt$|logStore\.txt$)/;
export const VRChatLogStoreFilePathSchema = z
  .string()
  .regex(
    VRChatLogStoreFilePathRegex,
    "Invalid log store file path. Expected format: 'logStore-YYYY-MM.txt', 'logStore-YYYY-MM-YYYYMMDDHHMMSS.txt', or 'logStore.txt'",
  )
  .transform((value) => {
    return new VRChatLogStoreFilePath(value);
  });
