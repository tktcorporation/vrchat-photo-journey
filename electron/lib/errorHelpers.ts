import type { Result } from 'neverthrow';
import { OperationFailedError, UserFacingError } from './errors';

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
    throw mapping(error);
  }

  if (errorMappings.default) {
    throw errorMappings.default(error);
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
      throw mapping(error);
    }

    if (errorMappings.default) {
      throw errorMappings.default(error);
    }
  }

  // マッピングがない場合は元のエラーをthrow（予期しないエラーとして扱われる）
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * ファイル操作系のエラーマッピング
 */
export const fileOperationErrorMappings = {
  ENOENT: () =>
    new UserFacingError('指定されたファイルまたはフォルダが見つかりません。'),
  canceled: () => new UserFacingError('操作がキャンセルされました。'),
  Error: () => new UserFacingError('ファイル操作中にエラーが発生しました。'),
  default: () => new UserFacingError('ファイル操作中にエラーが発生しました。'),
} as const;

/**
 * VRChatログファイル関連のエラーマッピング
 */
export const vrchatLogErrorMappings = {
  logFilesNotFound: () =>
    new UserFacingError(
      'VRChatのログファイルが見つかりません。VRChatを一度起動してからお試しください。',
    ),
  logFileDirNotFound: () =>
    new UserFacingError(
      'VRChatのログフォルダが見つかりません。設定からログフォルダのパスを確認してください。',
    ),
  logFilesDirNotSet: () =>
    new UserFacingError('VRChatのログフォルダが設定されていません。'),
} as const;

/**
 * 写真操作関連のエラーマッピング
 */
export const photoOperationErrorMappings = {
  InputFileIsMissing: () =>
    new UserFacingError(
      '写真ファイルが見つかりません。ファイルが移動または削除された可能性があります。',
    ),
  MODEL_NOT_FOUND: () => new UserFacingError('写真データが見つかりません。'),
  FILE_NOT_FOUND_MODEL_DELETED: () =>
    new UserFacingError(
      '写真ファイルが見つからないため、データベースから削除されました。',
    ),
} as const;

/**
 * データベース操作関連のエラーマッピング
 */
export const databaseErrorMappings = {
  DATABASE_ERROR: () => new OperationFailedError('データベース操作'),
  QUEUE_FULL: () =>
    new OperationFailedError(
      'データベース操作',
      'システムが混雑しています。しばらく待ってからお試しください。',
    ),
  TASK_TIMEOUT: () =>
    new OperationFailedError('データベース操作', 'タイムアウトしました。'),
  QUERY_ERROR: () => new OperationFailedError('データベースクエリ'),
  TRANSACTION_ERROR: () =>
    new OperationFailedError('データベーストランザクション'),
} as const;
