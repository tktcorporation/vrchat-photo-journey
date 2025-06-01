import { EventEmitter } from 'node:events';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
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
    if (error.cause instanceof UserFacingError) {
      userMessage = error.cause.message;
    } else if (
      error.cause instanceof Error &&
      error.cause.message.includes('test error for Sentry')
    ) {
      userMessage = 'Sentryテスト用のエラーが発生しました。';
    }

    return {
      ...shape,
      message: userMessage,
      data: {
        ...shape.data,
      },
    };
  },
});

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

  if (
    err instanceof UserFacingError ||
    (err instanceof Error && err.message.includes('test error for Sentry'))
  ) {
    eventEmitter.emit('toast', err.message);
  } else {
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
