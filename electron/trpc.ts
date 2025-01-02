import { EventEmitter } from 'node:events';
import { initTRPC } from '@trpc/server';
import { stackWithCauses } from 'pony-cause';
import superjson from 'superjson';
import * as log from './lib/logger';

const eventEmitter = new EventEmitter();

const t = initTRPC.create({
  isServer: true,
  transformer: superjson,
});

const logError = (err: Error | string, requestInfo?: string) => {
  eventEmitter.emit('toast', `${err}`);
  let error: Error;
  if (typeof err === 'string') {
    error = new Error(`TRPCErrorLogger: ${err}`);
  } else {
    error = new Error('TRPCErrorLogger', { cause: err });
  }
  const appVersion = process.env.npm_package_version;
  log.error(
    `version: ${appVersion}, request: ${requestInfo}`,
    stackWithCauses(error),
  );
};

const errorHandler = t.middleware(async (opts) => {
  const resp = await opts.next(opts);

  const requestInput = JSON.stringify(opts.input);

  if (!resp.ok) {
    logError(
      new Error('Caught error in TRPC middleware', { cause: resp.error }),
      `${opts.type} ${opts.path} ${requestInput}`,
    );
    throw resp.error;
  }

  return resp;
});

const logRequest = t.middleware(async (opts) => {
  // const { path, type } = opts;
  // log.debug(`Incoming request: ${type} ${path}`);
  return opts.next();
});

const { procedure: p } = t;

const procedure = p.use(logRequest).use(errorHandler);
const router = t.router;

export { procedure, router, eventEmitter, logError };
