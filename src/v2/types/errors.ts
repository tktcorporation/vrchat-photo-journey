/**
 * フロントエンド用エラー型定義
 * electron/lib/errors.ts の型定義と同期する必要がある
 */

/**
 * エラーのカテゴリー定義
 */
export const ERROR_CATEGORIES = {
  SETUP_REQUIRED: 'SETUP_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCategory =
  (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];

/**
 * 具体的なエラーコード定義
 */
export const ERROR_CODES = {
  // セットアップ関連
  VRCHAT_DIRECTORY_SETUP_REQUIRED: 'VRCHAT_DIRECTORY_SETUP_REQUIRED',
  PHOTO_DIRECTORY_SETUP_REQUIRED: 'PHOTO_DIRECTORY_SETUP_REQUIRED',

  // ファイル/ディレクトリアクセス関連
  VRCHAT_LOGS_ACCESS_DENIED: 'VRCHAT_LOGS_ACCESS_DENIED',
  PHOTO_DIRECTORY_ACCESS_DENIED: 'PHOTO_DIRECTORY_ACCESS_DENIED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',

  // データベース関連
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  DATABASE_MIGRATION_FAILED: 'DATABASE_MIGRATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // 一般的なエラー
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 構造化されたエラー情報
 */
export interface StructuredErrorInfo {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

/**
 * tRPCエラーからエラー情報を抽出
 */
export interface ParsedErrorInfo {
  code: ErrorCode;
  category: ErrorCategory;
  userMessage: string;
  isSetupRequired: boolean;
  isPermissionDenied: boolean;
  isUnknown: boolean;
}

/**
 * tRPCエラーメッセージから構造化情報を解析
 */
export function parseErrorMessage(errorMessage: string): ParsedErrorInfo {
  try {
    // 新しい構造化エラーの場合（JSONでエラー情報が含まれている可能性）
    const structuredMatch = errorMessage.match(/\{.*"code".*\}/);
    if (structuredMatch) {
      const parsed = JSON.parse(structuredMatch[0]) as StructuredErrorInfo;
      return {
        code: parsed.code,
        category: parsed.category,
        userMessage: parsed.userMessage,
        isSetupRequired: parsed.category === ERROR_CATEGORIES.SETUP_REQUIRED,
        isPermissionDenied:
          parsed.category === ERROR_CATEGORIES.PERMISSION_DENIED,
        isUnknown: parsed.category === ERROR_CATEGORIES.UNKNOWN_ERROR,
      };
    }
  } catch {
    // JSON解析に失敗した場合は従来のパターンマッチングにフォールバック
  }

  // 従来の文字列パターンマッチング（後方互換性のため）
  if (
    errorMessage.includes('LOG_DIRECTORY_ERROR') ||
    errorMessage.includes('VRChatフォルダの設定が必要') ||
    errorMessage.includes('初期セットアップ')
  ) {
    return {
      code: ERROR_CODES.VRCHAT_DIRECTORY_SETUP_REQUIRED,
      category: ERROR_CATEGORIES.SETUP_REQUIRED,
      userMessage: errorMessage.replace(/^[A-Z_]+:\s*/, ''),
      isSetupRequired: true,
      isPermissionDenied: false,
      isUnknown: false,
    };
  }

  // デフォルトは不明なエラー
  return {
    code: ERROR_CODES.UNKNOWN,
    category: ERROR_CATEGORIES.UNKNOWN_ERROR,
    userMessage: errorMessage,
    isSetupRequired: false,
    isPermissionDenied: false,
    isUnknown: true,
  };
}
