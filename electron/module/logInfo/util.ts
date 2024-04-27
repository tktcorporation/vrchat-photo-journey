import util from 'node:util';
import { getRDBClient } from './model';
const exec = util.promisify(require('node:child_process').exec);

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

export const resetDatabase = async () => {
  const rdbClient = getRDBClient();
  const execOptions = {
    env: {
      DATABASE_URL: rdbClient.__db_url,
    },
  };
  console.log('execOptions', execOptions);
  const prismaBinary = './node_modules/.bin/prisma';
  console.log(
    'resetDatabase',
    await exec(`${prismaBinary} migrate reset --force`, execOptions),
  );
};

export const migrateDatabase = async () => {
  const rdbClient = getRDBClient();
  const execOptions = {
    env: {
      DATABASE_URL: rdbClient.__db_url,
    },
  };
  console.log('execOptions', execOptions);
  const prismaBinary = './node_modules/.bin/prisma';
  console.log(
    'migrateDatabase',
    await exec(`${prismaBinary} migrate deploy`, execOptions),
  );
};
