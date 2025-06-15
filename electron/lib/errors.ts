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

export class UserFacingError extends Error {
  public readonly errorInfo?: StructuredErrorInfo;

  constructor(
    message: string,
    errorInfo?: StructuredErrorInfo,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'UserFacingError';
    this.errorInfo = errorInfo;

    // TypeScriptのカスタムエラーで instanceof が正しく動作するための設定
    Object.setPrototypeOf(this, UserFacingError.prototype);

    // Stack traceを適切に設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserFacingError);
    }
  }

  /**
   * 構造化されたエラー情報付きでUserFacingErrorを作成
   */
  static withStructuredInfo(errorInfo: StructuredErrorInfo): UserFacingError {
    return new UserFacingError(errorInfo.userMessage, errorInfo);
  }

  /**
   * 従来の文字列ベースのエラーメッセージから構造化情報を推測
   */
  static fromLegacyMessage(message: string): UserFacingError {
    // 既存のパターンマッチングロジックを移行
    if (message.includes('LOG_DIRECTORY_ERROR')) {
      return UserFacingError.withStructuredInfo({
        code: ERROR_CODES.VRCHAT_DIRECTORY_SETUP_REQUIRED,
        category: ERROR_CATEGORIES.SETUP_REQUIRED,
        message,
        userMessage: message.replace(/^[A-Z_]+:\s*/, ''),
      });
    }

    // デフォルトは不明なエラー
    return new UserFacingError(message, {
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message,
      userMessage: message,
    });
  }
}

// 特定の操作に失敗したことを示すエラーなど、より具体的なエラーも定義可能
// export class OperationFailedError extends UserFacingError {
//   constructor(operationName: string, details?: string, options?: ErrorOptions) {
//     super(
//       details
//         ? `${operationName}に失敗しました: ${details}`
//         : `${operationName}に失敗しました。`,
//       options,
//     );
//     this.name = 'OperationFailedError';
//     Object.setPrototypeOf(this, OperationFailedError.prototype);
//   }
// }
