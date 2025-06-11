const opaqueSymbol: unique symbol = Symbol('opaqueSymbol');

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
   * 主に設定値の比較処理で利用される
   */
  equals(other: BaseValueObject<T, K>): boolean {
    return this === other || this.value === other.value;
  }
}

/**
 * VRChatのログファイルが格納されているディレクトリのパス
 */
class VRChatLogFilesDirPath extends BaseValueObject<
  'VRChatLogFilesDirPath',
  string
> {}
/**
 * VRChatのログファイルが格納されているディレクトリのパス
 * (settingStoreから取得)
 */
class NotValidatedVRChatLogFilesDirPath extends BaseValueObject<
  'NotValidatedVRChatLogFilesDirPath',
  string
> {}
class VRChatLogFilePath extends BaseValueObject<
  'VRChatLogFilesDirPath',
  string
> {}

export type {
  VRChatLogFilesDirPath,
  VRChatLogFilePath,
  NotValidatedVRChatLogFilesDirPath,
};
export const VRChatLogFilesDirPathSchema = z.string().transform((value) => {
  return new VRChatLogFilesDirPath(value);
});
export const NotValidatedVRChatLogFilesDirPathSchema = z
  .string()
  .transform((value) => {
    return new NotValidatedVRChatLogFilesDirPath(value);
  });
export const VRChatLogFilePathSchema = z
  .string()
  .includes('output_log')
  .endsWith('.txt')
  .transform((value) => {
    return new VRChatLogFilePath(value);
  });
