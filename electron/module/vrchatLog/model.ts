const opaqueSymbol: unique symbol = Symbol('opaqueSymbol');

import * as datefns from 'date-fns';
import * as path from 'pathe';
import { z } from 'zod';

export abstract class BaseValueObject<T extends string, K> {
  // @ts-ignore TS1338
  private readonly [opaqueSymbol]: T;
  readonly value: K;

  constructor(value: K) {
    this.value = value;
  }
  /**
   * 値オブジェクト同士の等価性を比較する
   * ログ解析処理で識別子比較に使用される
   */
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
  return path.join(basePath, `logStore-${yearMonth}-${timestampStr}.txt`);
};

/**
 * VRChatプレイヤーID
 * usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx形式
 */
// biome-ignore lint/complexity/noStaticOnlyClass: valueObjectパターンの実装に静的メソッドが必要
class VRChatPlayerId extends BaseValueObject<'VRChatPlayerId', string> {
  /**
   * プレイヤーIDが有効な形式かを検証
   */
  public static isValid(value: string): boolean {
    const regex =
      /^usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return regex.test(value);
  }
}

/**
 * VRChatワールドID
 * wrld_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx形式
 */
// biome-ignore lint/complexity/noStaticOnlyClass: valueObjectパターンの実装に静的メソッドが必要
class VRChatWorldId extends BaseValueObject<'VRChatWorldId', string> {
  /**
   * ワールドIDが有効な形式かを検証
   */
  public static isValid(value: string): boolean {
    const regex =
      /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return regex.test(value);
  }
}

/**
 * VRChatワールドインスタンスID
 * 数値のみで構成される
 */
// biome-ignore lint/complexity/noStaticOnlyClass: valueObjectパターンの実装に静的メソッドが必要
class VRChatWorldInstanceId extends BaseValueObject<
  'VRChatWorldInstanceId',
  string
> {
  /**
   * インスタンスIDが有効な形式かを検証
   * 英数字のみ、または英数字~region(region_code)形式を許可
   */
  public static isValid(value: string): boolean {
    return /^[a-zA-Z0-9]+(\~.+)?$/.test(value);
  }
}

/**
 * VRChatプレイヤー名
 * 空文字列ではない文字列
 */
// biome-ignore lint/complexity/noStaticOnlyClass: valueObjectパターンの実装に静的メソッドが必要
class VRChatPlayerName extends BaseValueObject<'VRChatPlayerName', string> {
  /**
   * プレイヤー名が有効かを検証（空文字列でない）
   */
  public static isValid(value: string): boolean {
    return value.trim().length > 0;
  }
}

/**
 * VRChatワールド名
 * 空文字列ではない文字列
 */
// biome-ignore lint/complexity/noStaticOnlyClass: valueObjectパターンの実装に静的メソッドが必要
class VRChatWorldName extends BaseValueObject<'VRChatWorldName', string> {
  /**
   * ワールド名が有効かを検証（空文字列でない）
   */
  public static isValid(value: string): boolean {
    return value.trim().length > 0;
  }
}

export type { VRChatLogLine, VRChatLogStoreFilePath };
export {
  VRChatPlayerId,
  VRChatWorldId,
  VRChatWorldInstanceId,
  VRChatPlayerName,
  VRChatWorldName,
};

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

// ID検証用のZodスキーマ
export const VRChatPlayerIdSchema = z
  .string()
  .refine(VRChatPlayerId.isValid, {
    message:
      'Invalid VRChat Player ID format. Expected: usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  .transform((value) => new VRChatPlayerId(value));

export const VRChatWorldIdSchema = z
  .string()
  .refine(VRChatWorldId.isValid, {
    message:
      'Invalid VRChat World ID format. Expected: wrld_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  .transform((value) => new VRChatWorldId(value));

export const VRChatWorldInstanceIdSchema = z
  .string()
  .refine(VRChatWorldInstanceId.isValid, (value) => ({
    message: `Invalid VRChat World Instance ID format. Expected: alphanumeric string or alphanumeric~region(region_code). received: ${value}`,
  }))
  .transform((value) => new VRChatWorldInstanceId(value));

export const VRChatPlayerNameSchema = z
  .string()
  .refine(VRChatPlayerName.isValid, {
    message: 'Invalid VRChat Player Name. Cannot be empty',
  })
  .transform((value) => new VRChatPlayerName(value));

export const VRChatWorldNameSchema = z
  .string()
  .refine(VRChatWorldName.isValid, {
    message: 'Invalid VRChat World Name. Cannot be empty',
  })
  .transform((value) => new VRChatWorldName(value));

// オプショナルなプレイヤーID用のスキーマ
export const OptionalVRChatPlayerIdSchema = z
  .string()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    if (!VRChatPlayerId.isValid(value)) {
      throw new Error('Invalid VRChat Player ID format');
    }
    return new VRChatPlayerId(value);
  });
