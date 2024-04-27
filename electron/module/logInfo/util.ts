import { execSync } from 'node:child_process';
import * as iconv from 'iconv-lite';
import * as jschardet from 'jschardet';
import { getRDBClient } from './model';

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

const prismaBinary = './node_modules/.bin/prisma';

type BufferEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'utf-16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'hex';

const execCommand = async (
  command: string,
  options: {
    env: { [key: string]: string | undefined };
  },
) => {
  try {
    const result = execSync(command, options);
    return iconv.decode(result, 'UTF-8');
  } catch (error) {
    if (error instanceof Error) {
      // エンコーディングを推測する
      const detected = jschardet.detect(error.message);
      if (detected.confidence > 0.2) {
        // 確信度が高い場合のみ
        const messageBuffer = Buffer.from(
          error.message,
          detected.encoding as BufferEncoding,
        );
        const utf8Message = iconv.decode(messageBuffer, detected.encoding);

        // UTF-8でデコードされたメッセージでエラーを再スロー
        throw new Error(utf8Message, { cause: error });
      }
    }
    throw error;
  }
};

const validatePrismaBinaryExists = () => {
  execCommand(`${prismaBinary} -v`, {
    env: {
      ...process.env,
    },
  });
};

const execPrismaCommand = async (command: string) => {
  validatePrismaBinaryExists();

  const rdbClient = getRDBClient();
  process.env.DATABASE_URL = rdbClient.__db_url;
  const execOptions = {
    env: {
      ...process.env,
    },
  };
  console.log('execOptions', execOptions);

  console.log(
    'execPrismaCommand',
    await execCommand(`${prismaBinary} ${command}`, execOptions),
  );
};

export const resetDatabase = async () => {
  console.log(
    'resetDatabase',
    await execPrismaCommand('migrate reset --force'),
  );
};

export const migrateDatabase = async () => {
  console.log('resetDatabase', await execPrismaCommand('migrate deploy'));
};
