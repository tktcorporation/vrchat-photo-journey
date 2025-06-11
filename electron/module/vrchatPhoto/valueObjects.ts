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
   * 写真保存処理で同一パス判定に使用される
   */
  equals(other: BaseValueObject<T, K>): boolean {
    return this === other || this.value === other.value;
  }
}

/**
 * VRChatの写真ファイルが保存されているディレクトリパス
 */
class VRChatPhotoDirPath extends BaseValueObject<
  'VRChatPhotoDirPath',
  string
> {}

export type { VRChatPhotoDirPath };
export const VRChatPhotoDirPathSchema = z
  .string()
  .transform((value) => new VRChatPhotoDirPath(value));
