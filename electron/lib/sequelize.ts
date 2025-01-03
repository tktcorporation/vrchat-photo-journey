import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import path from 'pathe';
import { match } from 'ts-pattern';
import { uuidv7 } from 'uuidv7';
import { VRChatPlayerJoinLogModel } from '../module/VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import { VRChatPhotoPathModel } from '../module/vrchatPhoto/model/vrchatPhotoPath.model';
import { VRChatWorldJoinLogModel } from '../module/vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as settingService from './../module/settings/service';
import * as log from './logger';
import { Migrations } from './sequelize/migrations.model';

let rdbClient: ReturnType<typeof _newRDBClient> | null = null;
let migrationProgeress = false;

type SequelizeOptions = ConstructorParameters<typeof Sequelize>[0] & {
  storage: string;
};
const _newRDBClient = (props: { db_url: string }) => {
  const sequelizeOptions: SequelizeOptions = {
    dialect: SqliteDialect,
    storage: props.db_url,
    retry: {
      max: 10,
      timeout: 3000,
    },
    models: [
      VRChatWorldJoinLogModel,
      VRChatPlayerJoinLogModel,
      VRChatPhotoPathModel,
      Migrations,
    ],
  };
  log.debug(`sequelizeOptions: ${JSON.stringify(sequelizeOptions)}`);
  const client = new Sequelize(sequelizeOptions);
  return {
    __db_url: props.db_url,
    __client: client,
  };
};

export const initRDBClient = (props: { db_url: string }) => {
  return _initRDBClient({
    db_url: props.db_url,
  });
};

const _initRDBClient = (props: { db_url: string }) => {
  if (rdbClient !== null) {
    if (rdbClient.__db_url !== props.db_url) {
      throw new Error(
        `rdbClient is already initialized with ${rdbClient.__db_url}`,
      );
    }
    throw new Error(
      `rdbClient is already initialized with ${rdbClient.__db_url}`,
    );
  }
  rdbClient = _newRDBClient({
    db_url: props.db_url,
  });
  return rdbClient;
};

/**
 * テスト用の RDBClient を初期化する
 */
export const __initTestRDBClient = () => {
  // テスト環境でなければエラー
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV is not test');
  }
  // const dbPath = ':memory:';
  const dbPath = path.join(process.cwd(), 'debug', 'db', `test.${uuidv7()}.db`);
  return _initRDBClient({
    db_url: dbPath,
  });
};
export const __cleanupTestRDBClient = async () => {
  if (rdbClient === null) {
    return;
  }
  await rdbClient.__client.close();
  rdbClient = null;
};

export const getRDBClient = () => {
  if (rdbClient === null) {
    throw new Error('rdbClient is not initialized');
  }
  return rdbClient;
};

// 共通の sync 処理を抽出した関数
const executeSyncRDB = async (options: { force: boolean }) => {
  // 実行中は何もしない
  if (migrationProgeress) {
    log.info('migrationProgeress');
    return;
  }

  migrationProgeress = true;
  const appVersion = settingService.getAppVersion();
  try {
    // migration 実行
    const result = await getRDBClient().__client.sync({
      force: options.force,
      alter: true,
    });
    log.info('executeSyncRDB', result.options);

    // migration のバージョンを保存
    const now = new Date();
    await Migrations.create({
      version: appVersion,
      migratedAt: now,
    });
  } finally {
    migrationProgeress = false;
  }
};

export const syncRDBClient = async (options?: { checkRequired: boolean }) => {
  // デフォルトは確認してから実行
  const checkRequired = options?.checkRequired ?? true;
  const appVersion = await settingService.getAppVersion();
  const migrationRequired = match(checkRequired)
    .with(true, async () => await checkMigrationRDBClient(appVersion))
    .with(false, () => true);

  if (!migrationRequired) {
    return;
  }
  await executeSyncRDB({ force: false });
};

/**
 * テスト用の強制的なDB同期を行う関数
 * 既存のテーブルを削除して再作成する
 */
export const __forceSyncRDBClient = async () => {
  // テスト環境でなければエラー
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV is not test');
  }

  await executeSyncRDB({ force: true });
};

/**
 * migration の必要があるかどうかを確認する
 * true: migration が必要
 * false: migration が不要
 */
export const checkMigrationRDBClient = async (appVersion: string) => {
  // Migrations テーブルが存在しない場合は migration が必要
  const migrationsTableExists = await isExistsMigrationTable();
  if (!migrationsTableExists) {
    return true;
  }

  // 実施積みで最新の migration を取得
  const latestMigration = await Migrations.findOne({
    order: [['createdAt', 'DESC']],
  });
  // 初回は migration が必要
  if (latestMigration === null) {
    return true;
  }
  // 同じバージョンの migration が存在するか確認
  if (appVersion === latestMigration.version) {
    return false;
  }
  return true;
};

const isExistsMigrationTable = async () => {
  try {
    await Migrations.findAll();
    return true;
  } catch (e) {
    return match(e)
      .with(
        {
          name: 'SequelizeDatabaseError',
        },
        () => false,
      )
      .otherwise(() => {
        throw e;
      });
  }
};
