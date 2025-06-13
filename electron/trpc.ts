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
    let userMessage = '予期しないエラーが発生しました。';
    const cause = error.cause;

    if (cause instanceof UserFacingError) {
      userMessage = cause.message;
    } else if (
      cause instanceof Error &&
      cause.name === 'ZodError' &&
      Array.isArray((cause as ZodError).issues) &&
      (cause as ZodError).issues.length > 0
    ) {
      userMessage = (cause as ZodError).issues[0].message;
    } else if (
      cause instanceof Error &&
      cause.message.includes('test error for Sentry')
    ) {
      userMessage = 'Sentryテスト用のエラーが発生しました。';
    }

    // 詳細なエラー情報を含める（本番環境でもstacktraceを表示）
    let debugInfo = '';
    if (cause instanceof Error) {
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

  let toastMessage = '予期しないエラーが発生しました。';
  if (err instanceof UserFacingError) {
    toastMessage = err.message;
  } else if (
    err instanceof Error &&
    err.name === 'ZodError' &&
    Array.isArray((err as ZodError).issues) &&
    (err as ZodError).issues.length > 0
  ) {
    toastMessage = (err as ZodError).issues[0].message;
  } else if (
    err instanceof Error &&
    err.message.includes('test error for Sentry')
  ) {
    toastMessage = 'Sentryテスト用のエラーが発生しました。';
  }

  eventEmitter.emit('toast', toastMessage);
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
