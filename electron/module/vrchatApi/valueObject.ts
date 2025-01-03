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
 * VRChat World ID
 * wrld_1234as678-1a34-12a4-1a34-12a45d789012
 */
class VRChatWorldId extends BaseValueObject<'VRChatWorldId', string> {}

export type { VRChatWorldId };
export const VRChatWorldIdSchema = z
  .string()
  .superRefine((value, ctx) => {
    // VRChat World ID の形式: wrld_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    const pattern =
      /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!pattern.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid VRChat world ID: "${value}". `,
      });
    }
  })
  .transform((value) => {
    return new VRChatWorldId(value);
  });
