import { z } from 'zod';
import { BaseValueObject } from '../../lib/baseValueObject.js';

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
