const opaqueSymbol: unique symbol = Symbol('opaqueSymbol');

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
 * VRChatのログ行の保存先
 */
class VRChatLogStoreFilePath extends BaseValueObject<
  'VRChatLogStoreFilePath',
  string
> {}

export type { VRChatLogLine, VRChatLogStoreFilePath };
export const VRChatLogLineSchema = z.string().transform((value) => {
  return new VRChatLogLine(value);
});
export const VRChatLogStoreFilePathSchema = z.string().transform((value) => {
  return new VRChatLogStoreFilePath(value);
});
