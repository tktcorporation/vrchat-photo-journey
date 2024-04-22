import util from 'node:util';
const exec = util.promisify(require('node:child_process').exec);

// https://zenn.dev/susiyaki/articles/36a11cddd38e3a

export const resetDatabase = async (db_file_path: string) => {
  process.env.DATABASE_URL = `file:${db_file_path}`;
  console.log('process.env.DATABASE_URL', process.env.DATABASE_URL);
  const prismaBinary = './node_modules/.bin/prisma';
  console.log(
    'resetDatabase',
    await exec(
      `DATABASE_URL=${process.env.DATABASE_URL} ${prismaBinary} migrate reset --force`,
    ),
  );
};
