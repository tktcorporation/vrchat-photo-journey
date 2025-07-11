/**
 * TRPC エラーの型定義
 * TRPCClientError を拡張してカスタムエラー情報を含める
 */

import type { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '../../../electron/api';
import type { ErrorCategory, ErrorCode } from './errorConstants';

/**
 * 構造化エラー情報の型
 * バックエンドのerrorFormatterで設定される
 */
export interface StructuredError {
  code: ErrorCode;
  category: ErrorCategory;
  userMessage: string;
}

/**
 * カスタムエラーデータの型
 * TRPCのerrorFormatterで data に追加される情報
 */
export interface CustomErrorData {
  structuredError?: StructuredError;
  originalError?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * TRPC v10のエラー形状を表す型
 * shape.json.data または shape.data にエラー情報が含まれる
 */
interface TRPCErrorShape {
  shape?: {
    json?: {
      data?: unknown;
    };
    data?: unknown;
  };
}

/**
 * 型付きTRPCエラー
 * TRPCClientErrorにカスタムエラーデータを含めた型
 */
export type TypedTRPCError = TRPCClientError<AppRouter> & {
  data?: CustomErrorData;
};

/**
 * 型ガード: オブジェクトがTypedTRPCErrorかどうかを判定
 */
export function isTypedTRPCError(error: unknown): error is TypedTRPCError {
  // Check for direct data property (for testing)
  if (
    error instanceof Error &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null
  ) {
    return true;
  }

  // Check for TRPC v10 client error structure (shape.json.data or shape.data)
  const errorWithShape = error as Error & TRPCErrorShape;
  if (
    error instanceof Error &&
    'shape' in error &&
    typeof errorWithShape.shape === 'object' &&
    errorWithShape.shape !== null
  ) {
    // Check for shape.json.data
    if (
      'json' in errorWithShape.shape &&
      typeof errorWithShape.shape.json === 'object' &&
      errorWithShape.shape.json !== null &&
      'data' in errorWithShape.shape.json &&
      typeof errorWithShape.shape.json.data === 'object' &&
      errorWithShape.shape.json.data !== null
    ) {
      return true;
    }

    // Check for shape.data directly
    if (
      'data' in errorWithShape.shape &&
      typeof errorWithShape.shape.data === 'object'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * TRPCエラーオブジェクトから正規化されたエラーオブジェクトを返す
 * 元のエラーオブジェクトは変更せず、新しいオブジェクトを返す
 */
export function normalizeTypedTRPCError(error: unknown): TypedTRPCError | null {
  if (!isTypedTRPCError(error)) {
    return null;
  }

  // 直接dataプロパティがある場合
  if (
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null
  ) {
    return error as TypedTRPCError;
  }

  // shape.json.data からデータを抽出
  const errorWithShape = error as Error & TRPCErrorShape;
  if (
    errorWithShape.shape?.json?.data &&
    typeof errorWithShape.shape.json.data === 'object'
  ) {
    return {
      ...error,
      data: errorWithShape.shape.json.data as CustomErrorData,
    } as TypedTRPCError;
  }

  // shape.data からデータを抽出
  if (
    errorWithShape.shape?.data &&
    typeof errorWithShape.shape.data === 'object'
  ) {
    return {
      ...error,
      data: errorWithShape.shape.data as CustomErrorData,
    } as TypedTRPCError;
  }

  return null;
}

/**
 * 型ガード: エラーに構造化エラー情報が含まれているかを判定
 */
export function hasStructuredError(error: unknown): error is TypedTRPCError {
  const normalizedError = normalizeTypedTRPCError(error);
  return (
    normalizedError !== null &&
    normalizedError.data?.structuredError !== undefined &&
    typeof normalizedError.data.structuredError === 'object' &&
    'code' in normalizedError.data.structuredError &&
    'category' in normalizedError.data.structuredError &&
    'userMessage' in normalizedError.data.structuredError
  );
}

/**
 * TRPCエラーから構造化エラー情報を安全に取得
 */
export function getStructuredError(
  error: unknown,
): StructuredError | undefined {
  const normalizedError = normalizeTypedTRPCError(error);
  if (normalizedError?.data?.structuredError) {
    return normalizedError.data.structuredError;
  }
  return undefined;
}

/**
 * 使用例：
 *
 * // tRPC mutation のエラーハンドリング
 * const mutation = trpcReact.settings.initializeAppData.useMutation({
 *   onError: (error: TypedTRPCError) => {
 *     // 型安全に構造化エラー情報を取得
 *     const structuredError = getStructuredError(error);
 *     if (structuredError) {
 *       // structuredError.code, category, userMessage が型付きで使える
 *       console.log('Error code:', structuredError.code);
 *
 *       // ts-patternでのパターンマッチングも型安全
 *       match(structuredError.category)
 *         .with(ERROR_CATEGORIES.SETUP_REQUIRED, () => {
 *           // セットアップ画面を表示
 *         })
 *         .with(ERROR_CATEGORIES.PERMISSION_DENIED, () => {
 *           // 権限エラー処理
 *         })
 *         .otherwise(() => {
 *           // その他のエラー処理
 *         });
 *     }
 *   }
 * });
 */
