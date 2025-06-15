import type { Result } from 'neverthrow';
import { P, match } from 'ts-pattern';
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

  const userFacingError = match({
    mapping,
    hasDefault: !!errorMappings.default,
  })
    .with(
      { mapping: P.when((m) => m && typeof m === 'function') },
      ({ mapping }) => {
        const userError = mapping(error);
        // Original errorをcauseとして保持
        if (error instanceof Error && userError && !userError.cause) {
          Object.assign(userError, { cause: error });
        }
        return userError;
      },
    )
    .with({ hasDefault: true }, () => {
      const userError = errorMappings.default?.(error);
      // Original errorをcauseとして保持
      if (error instanceof Error && userError && !userError.cause) {
        Object.assign(userError, { cause: error });
      }
      return userError;
    })
    .otherwise(() => null);

  if (userFacingError) {
    throw userFacingError;
  }

  // マッピングがない場合は元のエラーをthrow（予期しないエラーとして扱われる）
  throw match(error)
    .with(P.instanceOf(Error), (err) => err)
    .otherwise((err) => new Error(String(err)));
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
  const userFacingError = match(errorMappings)
    .with(
      P.when((mappings) => !!mappings),
      (mappings) => {
        const mapping = mappings[errorKey];
        return match({ mapping, hasDefault: !!mappings.default })
          .with(
            { mapping: P.when((m) => m && typeof m === 'function') },
            ({ mapping }) => {
              const userError = mapping(error);
              // Original errorをcauseとして保持
              if (error instanceof Error && userError && !userError.cause) {
                Object.assign(userError, { cause: error });
              }
              return userError;
            },
          )
          .with({ hasDefault: true }, () => {
            const userError = mappings.default?.(error);
            // Original errorをcauseとして保持
            if (error instanceof Error && userError && !userError.cause) {
              Object.assign(userError, { cause: error });
            }
            return userError;
          })
          .otherwise(() => null);
      },
    )
    .otherwise(() => null);

  if (userFacingError) {
    throw userFacingError;
  }

  // マッピングがない場合は元のエラーをthrow（予期しないエラーとして扱われる）
  throw match(error)
    .with(P.instanceOf(Error), (err) => err)
    .otherwise((err) => new Error(String(err)));
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
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  canceled: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'Operation was canceled',
      userMessage: '操作がキャンセルされました。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  Error: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'File operation error',
      userMessage: 'ファイル操作中にエラーが発生しました。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  default: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'File operation error',
      userMessage: 'ファイル操作中にエラーが発生しました。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
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
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  MODEL_NOT_FOUND: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.DATABASE_ERROR,
      category: ERROR_CATEGORIES.DATABASE_ERROR,
      message: 'Photo data not found',
      userMessage: '写真データが見つかりません。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  FILE_NOT_FOUND_MODEL_DELETED: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.FILE_NOT_FOUND,
      category: ERROR_CATEGORIES.FILE_NOT_FOUND,
      message: 'Photo file not found, removed from database',
      userMessage:
        '写真ファイルが見つからないため、データベースから削除されました。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
  default: (originalError: unknown) =>
    UserFacingError.withStructuredInfo({
      code: ERROR_CODES.UNKNOWN,
      category: ERROR_CATEGORIES.UNKNOWN_ERROR,
      message: 'Photo operation error',
      userMessage: '写真操作中にエラーが発生しました。',
      cause: match(originalError)
        .with(P.instanceOf(Error), (err) => err)
        .otherwise((err) => new Error(String(err))),
    }),
} as const;

/**
 * 型安全なエラーハンドリングシステム
 * ts-patternを使用してエラー型に基づいた適切なマッピングを提供
 */

// 写真操作関連のエラー型定義
export type PhotoOperationError =
  | 'InputFileIsMissing'
  | 'MODEL_NOT_FOUND'
  | 'FILE_NOT_FOUND_MODEL_DELETED';

// ログ操作関連のエラー型定義（将来の拡張用）
export type LogOperationError =
  | 'LOG_FILE_NOT_FOUND'
  | 'LOG_PARSE_ERROR'
  | 'LOG_ACCESS_DENIED';

// データベース操作関連のエラー型定義
export type DatabaseOperationError =
  | 'CONNECTION_FAILED'
  | 'QUERY_FAILED'
  | 'TRANSACTION_FAILED';

/**
 * 型安全なエラーマッピング関数
 * ts-patternを使用してエラー型に基づいた適切なUserFacingErrorを生成
 */
export function handleTypedResultError<T, E extends string>(
  result: Result<T, E>,
  operationContext: {
    operationName: string;
    defaultUserMessage: string;
  },
): T {
  if (result.isOk()) {
    return result.value;
  }

  const error = result.error;
  const errorKey = String(error);

  // 型安全なError型チェック用のヘルパー
  const isErrorObject = (value: unknown): value is Error => {
    return value instanceof Error;
  };

  const userFacingError = match(errorKey)
    // 写真操作エラー
    .with('InputFileIsMissing', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.FILE_NOT_FOUND,
        category: ERROR_CATEGORIES.FILE_NOT_FOUND,
        message: 'Photo file is missing',
        userMessage:
          '写真ファイルが見つかりません。ファイルが移動または削除された可能性があります。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('MODEL_NOT_FOUND', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.DATABASE_ERROR,
        category: ERROR_CATEGORIES.DATABASE_ERROR,
        message: 'Photo data not found',
        userMessage: '写真データが見つかりません。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('FILE_NOT_FOUND_MODEL_DELETED', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.FILE_NOT_FOUND,
        category: ERROR_CATEGORIES.FILE_NOT_FOUND,
        message: 'Photo file not found, removed from database',
        userMessage:
          '写真ファイルが見つからないため、データベースから削除されました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    // ログ操作エラー（将来の拡張用）
    .with('LOG_FILE_NOT_FOUND', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.FILE_NOT_FOUND,
        category: ERROR_CATEGORIES.FILE_NOT_FOUND,
        message: 'Log file not found',
        userMessage: 'ログファイルが見つかりません。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('LOG_PARSE_ERROR', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.VALIDATION_ERROR,
        category: ERROR_CATEGORIES.VALIDATION_ERROR,
        message: 'Log file parse error',
        userMessage: 'ログファイルの解析中にエラーが発生しました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('LOG_ACCESS_DENIED', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.PERMISSION_DENIED,
        category: ERROR_CATEGORIES.PERMISSION_DENIED,
        message: 'Log file access denied',
        userMessage: 'ログファイルへのアクセスが拒否されました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    // データベース操作エラー
    .with('CONNECTION_FAILED', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.DATABASE_CONNECTION_FAILED,
        category: ERROR_CATEGORIES.DATABASE_ERROR,
        message: 'Database connection failed',
        userMessage: 'データベースへの接続に失敗しました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('QUERY_FAILED', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.DATABASE_ERROR,
        category: ERROR_CATEGORIES.DATABASE_ERROR,
        message: 'Database query failed',
        userMessage: 'データベースの操作中にエラーが発生しました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .with('TRANSACTION_FAILED', () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.DATABASE_ERROR,
        category: ERROR_CATEGORIES.DATABASE_ERROR,
        message: 'Database transaction failed',
        userMessage: 'データベーストランザクションに失敗しました。',
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    // デフォルトケース（型安全性を保ちつつ未知のエラーを処理）
    .with(P.string, () =>
      UserFacingError.withStructuredInfo({
        code: ERROR_CODES.UNKNOWN,
        category: ERROR_CATEGORIES.UNKNOWN_ERROR,
        message: `${operationContext.operationName} error: ${errorKey}`,
        userMessage: operationContext.defaultUserMessage,
        cause: isErrorObject(error) ? error : new Error(String(error)),
      }),
    )
    .exhaustive();

  throw userFacingError;
}

/**
 * 写真操作専用の型安全なエラーハンドラー
 */
export function handlePhotoOperationError<T>(
  result: Result<T, PhotoOperationError>,
): T {
  return handleTypedResultError(result, {
    operationName: 'Photo operation',
    defaultUserMessage: '写真操作中にエラーが発生しました。',
  });
}

/**
 * ログ操作専用の型安全なエラーハンドラー
 */
export function handleLogOperationError<T>(
  result: Result<T, LogOperationError>,
): T {
  return handleTypedResultError(result, {
    operationName: 'Log operation',
    defaultUserMessage: 'ログ操作中にエラーが発生しました。',
  });
}

/**
 * データベース操作専用の型安全なエラーハンドラー
 */
export function handleDatabaseOperationError<T>(
  result: Result<T, DatabaseOperationError>,
): T {
  return handleTypedResultError(result, {
    operationName: 'Database operation',
    defaultUserMessage: 'データベース操作中にエラーが発生しました。',
  });
}
