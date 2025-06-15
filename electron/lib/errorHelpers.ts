import type { Result } from 'neverthrow';
import { ERROR_CATEGORIES, ERROR_CODES, UserFacingError } from './errors';

/**
 * neverthrowのResultパターンとUserFacingErrorパターンを橋渡しするヘルパー関数群
 */

/**
 * Resultがerrの場合に、適切なUserFacingErrorを投げる
 * @param result neverthrowのResult
 * @param errorMappings エラー値をUserFacingErrorにマッピングする関数群
 */
export function handleResultError<T, E>(
  result: Result<T, E>,
  errorMappings: {
    [key: string]: (error: E) => UserFacingError;
  } & {
    default?: (error: E) => UserFacingError;
  },
): T {
  if (result.isOk()) {
    return result.value;
  }

  const error = result.error;

  // エラーを文字列キーとして変換
  let errorKey: string;
  if (error instanceof Error) {
    errorKey = error.constructor.name;
  } else {
    errorKey = String(error);
  }

  const mapping = errorMappings[errorKey];

  if (mapping && typeof mapping === 'function') {
    const userFacingError = mapping(error);
    // Original errorをcauseとして保持
    if (error instanceof Error && !userFacingError.cause) {
      Object.assign(userFacingError, { cause: error });
    }
    throw userFacingError;
  }

  if (errorMappings.default) {
    const userFacingError = errorMappings.default(error);
    // Original errorをcauseとして保持
    if (error instanceof Error && !userFacingError.cause) {
      Object.assign(userFacingError, { cause: error });
    }
    throw userFacingError;
  }

  // マッピングがない場合は元のエラーをthrow（予期しないエラーとして扱われる）
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * Resultがerrの場合に、マッピングに基づいてサイレントに処理するか、UserFacingErrorを投げる
 * @param result neverthrowのResult
 * @param silentErrors サイレントに処理するエラーのリスト
 * @param errorMappings その他のエラーのマッピング
 */
export function handleResultErrorWithSilent<T, E>(
  result: Result<T, E>,
  silentErrors: string[],
  errorMappings?: {
    [key: string]: (error: E) => UserFacingError;
  } & {
    default?: (error: E) => UserFacingError;
  },
): T | null {
  if (result.isOk()) {
    return result.value;
  }

  const error = result.error;

  // エラーを文字列キーとして変換
  let errorKey: string;
  if (error instanceof Error) {
    errorKey = error.constructor.name;
  } else {
    errorKey = String(error);
  }

  // サイレントエラーの場合はnullを返す
  if (silentErrors.includes(errorKey)) {
    return null;
  }

  // エラーマッピングがある場合は適用
  if (errorMappings) {
    const mapping = errorMappings[errorKey];

    if (mapping && typeof mapping === 'function') {
      const userFacingError = mapping(error);
      // Original errorをcauseとして保持
      if (error instanceof Error && !userFacingError.cause) {
        Object.assign(userFacingError, { cause: error });
      }
      throw userFacingError;
    }

    if (errorMappings.default) {
      const userFacingError = errorMappings.default(error);
      // Original errorをcauseとして保持
      if (error instanceof Error && !userFacingError.cause) {
        Object.assign(userFacingError, { cause: error });
      }
      throw userFacingError;
    }
  }

  // マッピングがない場合は元のエラーをthrow（予期しないエラーとして扱われる）
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * ファイル操作系のエラーマッピング
 */
export const fileOperationErrorMappings = {
  ENOENT: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.FILE_NOT_FOUND,
      category: ERROR_CATEGORIES.FILE_NOT_FOUND,
      message: 'File or directory not found',
      userMessage: '指定されたファイルまたはフォルダが見つかりません。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
  canceled: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'Operation was canceled',
      userMessage: '操作がキャンセルされました。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
  Error: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'File operation error',
      userMessage: 'ファイル操作中にエラーが発生しました。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
  default: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'File operation error',
      userMessage: 'ファイル操作中にエラーが発生しました。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
} as const;

/**
 * 写真操作関連のエラーマッピング
 */
export const photoOperationErrorMappings = {
  InputFileIsMissing: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.FILE_NOT_FOUND,
      category: ERROR_CATEGORIES.FILE_NOT_FOUND,
      message: 'Photo file is missing',
      userMessage:
        '写真ファイルが見つかりません。ファイルが移動または削除された可能性があります。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
  MODEL_NOT_FOUND: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.DATABASE_ERROR,
      category: ERROR_CATEGORIES.DATABASE_ERROR,
      message: 'Photo data not found',
      userMessage: '写真データが見つかりません。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
  FILE_NOT_FOUND_MODEL_DELETED: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.FILE_NOT_FOUND,
      category: ERROR_CATEGORIES.FILE_NOT_FOUND,
      message: 'Photo file not found, removed from database',
      userMessage:
        '写真ファイルが見つからないため、データベースから削除されました。',
      cause:
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
    }),
} as const;
