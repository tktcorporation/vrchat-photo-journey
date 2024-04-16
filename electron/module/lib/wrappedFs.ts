import * as fs from 'node:fs';
import { promisify } from 'node:util';
import { type Result, err, ok } from 'neverthrow';
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
// const toFSError = (error: Error & { code?: string }): FSError => {
//   switch (error.code) {
//     case 'ENOENT':
//       return 'ENOENT';
//     default:
//       throw error;
//   }
// };

export const readDirSyncSafe = (dirPath: string): Result<string[], FSError> => {
  const dirNames = fs.readdirSync(dirPath);
  return ok(dirNames);
};

export const writeFileSyncSafe = (
  filePath: string,
  data: string | Uint8Array,
  options?: Parameters<typeof fs.writeFileSync>[2],
): Result<void, Error> => {
  try {
    fs.writeFileSync(filePath, data, options);
    return ok(undefined);
  } catch (e) {
    if (e instanceof Error) {
      return err(e);
    }
    throw e;
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

export const existsSyncSafe = (path: string): Result<boolean, Error> => {
  const result = fs.existsSync(path);
  return ok(result);
};

export const readFileSafe = (
  filePath: string,
  options?: { encoding?: null; flag?: string } | null,
): Result<Buffer, Error> => {
  const content = fs.readFileSync(filePath, options);
  return ok(content);
};

const readFilePromisified = promisify(fs.readFile);
type PromiseType<T extends PromiseLike<unknown>> = T extends PromiseLike<
  infer P
>
  ? P
  : never;
type ReadFileReturn = PromiseType<ReturnType<typeof readFilePromisified>>;
export const readFileAsync = async (
  ...args: Parameters<typeof readFilePromisified>
): Promise<Result<ReadFileReturn, Error>> => {
  const data = await readFilePromisified(...args);
  return ok(data);
};

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
    const error = match(e)
      // .with({ code: 'EEXIST' }, (ee) => err({code: ee.code, error: ee}))
      .otherwise(() => null);
    if (error) {
      return error;
    }
    throw e;
  }
};

// delete file
const unlinkPromisified = promisify(fs.unlink);
type UnlinkReturn = PromiseType<ReturnType<typeof unlinkPromisified>>;
export const unlinkAsync = async (
  ...args: Parameters<typeof unlinkPromisified>
): Promise<
  Result<UnlinkReturn, { code: 'ENOENT'; error: NodeJS.ErrnoException }>
> => {
  try {
    const data = await unlinkPromisified(...args);
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

export const createReadStream = (
  filePath: string,
  options?: Parameters<typeof fs.createReadStream>[1],
): fs.ReadStream => {
  return fs.createReadStream(filePath, options);
};
