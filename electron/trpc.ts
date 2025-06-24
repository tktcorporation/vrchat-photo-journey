import { EventEmitter } from 'node:events';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { ZodError } from 'zod';
import { UserFacingError } from './lib/errors';
import { logger } from './lib/logger';
import * as settingService from './module/settings/service';

const eventEmitter = new EventEmitter();

const t = initTRPC.context<{ eventEmitter: EventEmitter }>().create({
  isServer: true,
  transformer: superjson,
  errorFormatter: (opts) => {
    const { shape, error } = opts;
    const cause = error.cause;

    let userMessage: string;
    let structuredErrorInfo: {
      code: string;
      category: string;
      userMessage: string;
    } | null = null;

    if (cause instanceof UserFacingError) {
      userMessage = cause.message;
      structuredErrorInfo =
        cause.code && cause.category
          ? {
              code: cause.code,
              category: cause.category,
              userMessage: cause.userMessage || cause.message,
            }
          : null;
    } else if (cause instanceof Error && cause.name === 'ZodError') {
      // ZodErrorの場合
      const zodError = cause as ZodError;
      userMessage = zodError.issues[0].message;
      structuredErrorInfo = {
        code: 'VALIDATION_ERROR',
        category: 'VALIDATION_ERROR',
        userMessage: zodError.issues[0].message,
      };
    } else if (
      cause instanceof Error &&
      cause.message.includes('test error for Sentry')
    ) {
      userMessage = 'Sentryテスト用のエラーが発生しました。';
      structuredErrorInfo = null;
    } else {
      userMessage = '予期しないエラーが発生しました。';
      structuredErrorInfo = null;
    }

    // UserFacingErrorの場合は詳細情報を表示しない（構造化エラー情報で十分）
    let debugInfo = '';
    if (cause instanceof Error && !(cause instanceof UserFacingError)) {
      debugInfo = ` [詳細: ${cause.message}${
        cause.stack
          ? `\nStack: ${cause.stack.split('\n').slice(0, 3).join('\n')}`
          : ''
      }]`;
    }

    return {
      ...shape,
      message: userMessage + debugInfo,
      data: {
        ...shape.data,
        // 構造化エラー情報を含める（フロントエンドでの解析用）
        ...(structuredErrorInfo && { structuredError: structuredErrorInfo }),
        // 原因エラーの詳細も含める
        ...(cause instanceof Error && {
          originalError: {
            name: cause.name,
            message: cause.message,
            stack: cause.stack,
          },
        }),
      },
    };
  },
});

/**
 * tRPC ミドルウェアから呼び出されるエラーログ用関数
 * バージョン情報とリクエスト内容を付加して Sentry へ送信する
 * 構造化エラー情報に基づいてトーストメッセージを送信する
 */
const logError = (
  err: Error | string,
  requestInfo?: string,
  originalError?: Error,
) => {
  const errorToLog =
    originalError || (err instanceof Error ? err : new Error(String(err)));
  const appVersion = settingService.getAppVersion();

  logger.error({
    message: `version: ${appVersion}, request: ${requestInfo}, error: ${errorToLog.message}`,
    stack: errorToLog,
  });

  // 構造化エラー情報を含むトーストメッセージを生成
  if (err instanceof UserFacingError && err.code && err.category) {
    // 構造化エラー情報がある場合
    const structuredToastMessage = {
      message: err.message,
      errorInfo: {
        code: err.code,
        category: err.category,
        userMessage: err.userMessage || err.message,
      },
    };
    eventEmitter.emit('toast', structuredToastMessage);
  } else if (err instanceof Error && err.name === 'ZodError') {
    // Zodバリデーションエラーの場合
    const zodError = err as ZodError;
    const validationMessage = zodError.issues[0].message;
    const structuredToastMessage = {
      message: validationMessage,
      errorInfo: {
        code: 'VALIDATION_ERROR',
        category: 'VALIDATION_ERROR',
        userMessage: validationMessage,
      },
    };
    eventEmitter.emit('toast', structuredToastMessage);
  } else if (
    err instanceof Error &&
    err.message.includes('test error for Sentry')
  ) {
    // Sentryテスト用エラーの場合
    eventEmitter.emit('toast', 'Sentryテスト用のエラーが発生しました。');
  } else if (err instanceof UserFacingError) {
    // UserFacingErrorだが構造化情報がない場合
    eventEmitter.emit('toast', err.message);
  } else {
    // その他のエラー（予期しないエラー）
    eventEmitter.emit('toast', '予期しないエラーが発生しました。');
  }
};

const errorHandler = t.middleware(async (opts) => {
  try {
    const result = await opts.next(opts);
    if (!result.ok) {
      const originalError =
        result.error.cause instanceof Error ? result.error.cause : result.error;
      const requestInfo = `${opts.type} ${opts.path} ${JSON.stringify(
        opts.input,
      )}`;
      logError(originalError, requestInfo, originalError);
    }
    return result;
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    const requestInfo = `${opts.type} ${opts.path} ${JSON.stringify(
      opts.input,
    )}`;

    logError(error, requestInfo, error);

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    });
  }
});

const logRequest = t.middleware(async (opts) => {
  return opts.next();
});

const { procedure: p, router: r } = t;

const procedure = p.use(logRequest).use(errorHandler);
const router = r;

export { procedure, router, eventEmitter };
