import { EventEmitter } from 'node:events';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { P, match } from 'ts-pattern';
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

    const { userMessage, structuredErrorInfo } = match(cause)
      .with(P.instanceOf(UserFacingError), (e) => {
        if (e.code && e.category) {
          return {
            userMessage: e.message,
            structuredErrorInfo: {
              code: e.code,
              category: e.category,
              userMessage: e.userMessage || e.message,
            },
          };
        }
        return {
          userMessage: e.message,
          structuredErrorInfo: null,
        };
      })
      .with(P.instanceOf(Error), (e) => {
        if (
          e.name === 'ZodError' &&
          Array.isArray((e as ZodError).issues) &&
          (e as ZodError).issues.length > 0
        ) {
          const zodError = e as ZodError;
          const message = zodError.issues[0].message;
          return {
            userMessage: message,
            structuredErrorInfo: {
              code: 'VALIDATION_ERROR',
              category: 'VALIDATION_ERROR',
              userMessage: message,
            },
          };
        }
        if (e.message.includes('test error for Sentry')) {
          return {
            userMessage: 'Sentryテスト用のエラーが発生しました。',
            structuredErrorInfo: null,
          };
        }
        return {
          userMessage: '予期しないエラーが発生しました。',
          structuredErrorInfo: null,
        };
      })
      .otherwise(() => ({
        userMessage: '予期しないエラーが発生しました。',
        structuredErrorInfo: null,
      }));

    // UserFacingErrorの場合は詳細情報を表示しない（構造化エラー情報で十分）
    const debugInfo = match(cause)
      .with(
        P.instanceOf(Error).and(P.not(P.instanceOf(UserFacingError))),
        (e) =>
          ` [詳細: ${e.message}${
            e.stack
              ? `\nStack: ${e.stack.split('\n').slice(0, 3).join('\n')}`
              : ''
          }]`,
      )
      .otherwise(() => '');

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
  match(err)
    .with(P.instanceOf(UserFacingError), (e) => {
      if (e.code && e.category) {
        const structuredToastMessage = {
          message: e.message,
          errorInfo: {
            code: e.code,
            category: e.category,
            userMessage: e.userMessage || e.message,
          },
        };
        eventEmitter.emit('toast', structuredToastMessage);
      } else {
        eventEmitter.emit('toast', e.message);
      }
    })
    .with(P.instanceOf(Error), (e) => {
      if (
        e.name === 'ZodError' &&
        Array.isArray((e as ZodError).issues) &&
        (e as ZodError).issues.length > 0
      ) {
        const zodError = e as ZodError;
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
      } else if (e.message.includes('test error for Sentry')) {
        eventEmitter.emit('toast', 'Sentryテスト用のエラーが発生しました。');
      } else {
        eventEmitter.emit('toast', '予期しないエラーが発生しました。');
      }
    })
    .otherwise(() =>
      eventEmitter.emit('toast', '予期しないエラーが発生しました。'),
    );
};

const errorHandler = t.middleware(async (opts) => {
  try {
    const result = await opts.next(opts);
    if (!result.ok) {
      const originalError = match(result.error.cause)
        .with(P.instanceOf(Error), (e) => e)
        .otherwise(() => result.error);
      const requestInfo = `${opts.type} ${opts.path} ${JSON.stringify(
        opts.input,
      )}`;
      logError(originalError, requestInfo, originalError);
    }
    return result;
  } catch (cause) {
    const error = match(cause)
      .with(P.instanceOf(Error), (e) => e)
      .otherwise((c) => new Error(String(c)));
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
