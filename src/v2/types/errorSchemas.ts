import { z } from 'zod';
import { ERROR_CATEGORIES, ERROR_CODES } from './errorConstants';

/**
 * 構造化エラー情報のスキーマ
 */
export const StructuredErrorSchema = z.object({
  code: z.nativeEnum(ERROR_CODES),
  category: z.nativeEnum(ERROR_CATEGORIES),
  userMessage: z.string(),
});

/**
 * tRPCエラーのデータ部分のスキーマ
 */
export const TRPCErrorDataSchema = z.object({
  structuredError: StructuredErrorSchema.optional(),
  originalError: z
    .object({
      name: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
});

/**
 * tRPC v10のエラー構造（直接dataプロパティ）
 */
export const DirectDataErrorSchema = z.object({
  data: TRPCErrorDataSchema,
});

/**
 * tRPC v10のエラー構造（shape.data）
 */
export const ShapeDataErrorSchema = z.object({
  shape: z.object({
    data: TRPCErrorDataSchema,
  }),
});

/**
 * tRPC v10のエラー構造（shape.json.data）
 */
export const ShapeJsonDataErrorSchema = z.object({
  shape: z.object({
    json: z.object({
      data: TRPCErrorDataSchema,
    }),
  }),
});

/**
 * すべての可能なtRPCエラー構造の統合スキーマ
 */
export const TRPCErrorSchema = z.union([
  DirectDataErrorSchema,
  ShapeDataErrorSchema,
  ShapeJsonDataErrorSchema,
]);

/**
 * エラーオブジェクトから構造化エラー情報を安全に抽出
 */
export function extractStructuredError(error: unknown) {
  // DirectDataパターンを試行
  const directDataResult = DirectDataErrorSchema.safeParse(error);
  if (directDataResult.success) {
    return directDataResult.data.data.structuredError;
  }

  // ShapeDataパターンを試行
  const shapeDataResult = ShapeDataErrorSchema.safeParse(error);
  if (shapeDataResult.success) {
    return shapeDataResult.data.shape.data.structuredError;
  }

  // ShapeJsonDataパターンを試行
  const shapeJsonDataResult = ShapeJsonDataErrorSchema.safeParse(error);
  if (shapeJsonDataResult.success) {
    return shapeJsonDataResult.data.shape.json.data.structuredError;
  }

  return undefined;
}
