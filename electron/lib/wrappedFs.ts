import * as fs from 'node:fs';
import { promisify } from 'node:util';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import { P, match } from 'ts-pattern';

export const readFileSyncSafe = (
  filePath: string,
  options?: { encoding?: null; flag?: string } | null,
): Result<
  Buffer,
  { code: 'ENOENT' | string; message: string; error: Error }
> => {
  try {
    const content = fs.readFileSync(filePath, options);
    return ok(content);
  } catch (e) {
    if (!isNodeError(e)) {
      throw e;
    }
    const error = match(e)
      .with({ code: 'ENOENT', message: P.string }, (ee) =>
        err({ code: 'ENOENT' as const, message: ee.message, error: ee }),
      )
      .otherwise(() => null);
    if (error) {
      return error;
    }
    throw e;
  }
};

export type FSError = 'ENOENT';

const readdirPromisified = promisify(fs.readdir);
type ReaddirReturn = PromiseType<ReturnType<typeof readdirPromisified>>;
export const readdirAsync = async (
  ...args: Parameters<typeof readdirPromisified>
): Promise<
  Result<ReaddirReturn, { code: 'ENOENT'; error: NodeJS.ErrnoException }>
> => {
  try {
    const data = await readdirPromisified(...args);
    return ok(data);
  } catch (e) {
    if (!isNodeError(e)) {
      throw e;
    }
    const error = match(e)
      .with({ code: 'ENOENT' }, (ee) => err({ code: ee.code, error: ee }))
      .otherwise(() => null);
    if (error) {
      return error;
    }
    throw e;
  }
};

export const writeFileSyncSafe = (
  path: string,
  data: string | Uint8Array,
): Result<void, Error> => {
  try {
    fs.writeFileSync(path, data);
    return ok(undefined);
  } catch (e) {
    return err(e as Error);
  }
};

import typeUtils from 'node:util/types';

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeUtils.isNativeError(error);
}

export const mkdirSyncSafe = async (
  dirPath: string,
): Promise<Result<void, { code: 'EEXIST'; error: NodeJS.ErrnoException }>> => {
  try {
    await promisify(fs.mkdir)(dirPath);
    return ok(undefined);
  } catch (e) {
    if (!isNodeError(e)) {
      throw e;
    }
    const error = match(e)
      .with({ code: 'EEXIST' }, (ee) => err({ code: ee.code, error: ee }))
      .otherwise(() => null);
    if (error) {
      return error;
    }
    throw e;
  }
};

export const existsSyncSafe = (path: string): boolean => {
  return fs.existsSync(path);
};

export const readFileSafe = (
  filePath: string,
  options?: { encoding?: null; flag?: string } | null,
): Result<Buffer, Error> => {
  const content = fs.readFileSync(filePath, options);
  return ok(content);
};

type PromiseType<T extends PromiseLike<unknown>> = T extends PromiseLike<
  infer P
>
  ? P
  : never;

const appendFilePromisified = promisify(fs.appendFile);
type AppendFileReturn = PromiseType<ReturnType<typeof appendFilePromisified>>;
export const appendFileAsync = async (
  ...args: Parameters<typeof appendFilePromisified>
): Promise<
  Result<AppendFileReturn, { code: 'ENOENT'; error: NodeJS.ErrnoException }>
> => {
  try {
    const data = await appendFilePromisified(...args);
    return ok(data);
  } catch (e) {
    if (!isNodeError(e)) {
      throw e;
    }
    const error = match(e).otherwise(() => null);
    if (error) {
      return error;
    }
    throw e;
  }
};

// delete file
export const unlinkAsync = async (
  path: string,
): Promise<Result<void, Error>> => {
  try {
    await fs.promises.unlink(path);
    return ok(undefined);
  } catch (e) {
    return err(e as Error);
  }
};

export const createReadStream = (
  filePath: string,
  options?: Parameters<typeof fs.createReadStream>[1],
): fs.ReadStream => {
  return fs.createReadStream(filePath, options);
};

export const readdir = async (path: string): Promise<string[]> => {
  try {
    return await promisify(fs.readdir)(path);
  } catch (error) {
    console.error(`Failed to read directory: ${path}`, error);
    return [];
  }
};
