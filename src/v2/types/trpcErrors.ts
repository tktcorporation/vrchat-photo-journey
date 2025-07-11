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
 * shape.json.data にエラー情報が含まれる
 */
interface TRPCErrorShape {
  shape?: {
    json?: {
      data?: unknown;
    };
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

  // Check for TRPC v10 client error structure (shape.json.data)
  const errorWithShape = error as Error & TRPCErrorShape;
  if (
    error instanceof Error &&
    'shape' in error &&
    typeof errorWithShape.shape === 'object' &&
    errorWithShape.shape !== null
  ) {
    if (
      'json' in errorWithShape.shape &&
      typeof errorWithShape.shape.json === 'object' &&
      errorWithShape.shape.json !== null &&
      'data' in errorWithShape.shape.json &&
      typeof errorWithShape.shape.json.data === 'object' &&
      errorWithShape.shape.json.data !== null
    ) {
      // Normalize the error structure by copying shape.json.data to data
      // Use Object.defineProperty to avoid TypeScript errors
      Object.defineProperty(error, 'data', {
        value: errorWithShape.shape.json.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return true;
    }
  }

  // Additional check for TRPC error structure (shape.data directly)
  if (
    error instanceof Error &&
    'shape' in error &&
    typeof errorWithShape.shape === 'object' &&
    errorWithShape.shape !== null &&
    'data' in errorWithShape.shape &&
    typeof errorWithShape.shape.data === 'object'
  ) {
    // Normalize to expected structure
    Object.defineProperty(error, 'data', {
      value: errorWithShape.shape.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return true;
  }

  return false;
}

/**
 * 型ガード: エラーに構造化エラー情報が含まれているかを判定
 */
export function hasStructuredError(error: unknown): error is TypedTRPCError {
  return (
    isTypedTRPCError(error) &&
    error.data?.structuredError !== undefined &&
    typeof error.data.structuredError === 'object' &&
    'code' in error.data.structuredError &&
    'category' in error.data.structuredError &&
    'userMessage' in error.data.structuredError
  );
}

/**
 * TRPCエラーから構造化エラー情報を安全に取得
 */
export function getStructuredError(
  error: unknown,
): StructuredError | undefined {
  if (hasStructuredError(error) && error.data?.structuredError) {
    return error.data.structuredError;
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
