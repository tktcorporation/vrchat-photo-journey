import { EventEmitter } from 'node:events';
import { initTRPC } from '@trpc/server';
import * as log from 'electron-log';
import { stackWithCauses } from 'pony-cause';
import superjson from 'superjson';

const eventEmitter = new EventEmitter();

const t = initTRPC.create({
  isServer: true,
  transformer: superjson,
});

const logError = (err: Error | string) => {
  eventEmitter.emit('toast', `${err}`);
  let error: Error;
  if (typeof err === 'string') {
    error = new Error(`TRPCErrorLogger: ${err}`);
  } else {
    error = new Error('TRPCErrorLogger', { cause: err });
  }
  const appVersion = process.env.npm_package_version;
  log.error(`version: ${appVersion}`, stackWithCauses(error));
};

const errorHandler = t.middleware(async (opts) => {
  const resp = await opts.next(opts);

  if (!resp.ok) {
    logError(
      new Error('Caught error in TRPC middleware', { cause: resp.error }),
    );
    throw resp.error;
  }

  return resp;
});

const { procedure: p } = t;

const procedure = p.use(errorHandler);
const router = t.router;

export { procedure, router, eventEmitter, logError };
