import { execSync } from 'node:child_process';
import { getRDBClient } from './model';

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

const prismaBinary = './node_modules/.bin/prisma';

const validatePrismaBinaryExists = () => {
  execSync(`${prismaBinary} -v`);
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
    await execSync(`${prismaBinary} ${command}`, execOptions),
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
