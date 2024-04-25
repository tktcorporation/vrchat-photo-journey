import util from 'node:util';
import { getRDBClient } from './model';
const exec = util.promisify(require('node:child_process').exec);

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

export const resetDatabase = async () => {
  const rdbClient = getRDBClient();
  process.env.DATABASE_URL = rdbClient.__db_url;
  console.log('process.env.DATABASE_URL', process.env.DATABASE_URL);
  const prismaBinary = './node_modules/.bin/prisma';
  console.log(
    'resetDatabase',
    await exec(
      `DATABASE_URL=${process.env.DATABASE_URL} ${prismaBinary} migrate reset --force`,
    ),
  );
};

export const migrateDatabase = async () => {
  const rdbClient = getRDBClient();
  process.env.DATABASE_URL = rdbClient.__db_url;
  console.log('process.env.DATABASE_URL', process.env.DATABASE_URL);
  const prismaBinary = './node_modules/.bin/prisma';
  console.log(
    'migrateDatabase',
    await exec(
      `DATABASE_URL=${process.env.DATABASE_URL} ${prismaBinary} migrate deploy`,
    ),
  );
};
