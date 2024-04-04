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

class VRChatLogFilesDirPath extends BaseValueObject<'VRChatLogFilesDirPath', string> {}
class VRChatLogFilePath extends BaseValueObject<'VRChatLogFilesDirPath', string> {}

export type { VRChatLogFilesDirPath, VRChatLogFilePath };
export const VRChatLogFilesDirPathSchema = z.string().transform((value) => {
    return new VRChatLogFilesDirPath(value);
    });
export const VRChatLogFilePathSchema = z.string().includes('output_log').endsWith('.txt').transform(value => {
    return new VRChatLogFilePath(value);
    }
);