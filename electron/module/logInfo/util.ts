import { execSync } from 'node:child_process';
import * as iconv from 'iconv-lite';
import { getRDBClient } from './model';

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

const prismaBinary = './node_modules/.bin/prisma';

const execCommand = async (
  command: string,
  options: {
    env: { [key: string]: string | undefined };
  },
) => {
  const result = execSync(command, options);
  return iconv.decode(result, 'UTF-8');
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
