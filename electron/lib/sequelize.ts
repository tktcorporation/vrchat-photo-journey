import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import { match } from 'ts-pattern';
import { VRChatPlayerJoinLogModel } from '../module/VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import { VRChatWorldJoinLogModel } from '../module/VRChatWorldJoinLogModel/s_model';
import * as settingService from './../module/settings/service';
import * as log from './logger';
import { Migrations } from './sequelize/migrations.model';

let rdbClient: ReturnType<typeof _getRDBClient> | null = null;
let migrationProgeress = false;

const _getRDBClient = (props: { db_url: string }) => {
  const sequelizeOptions = {
    dialect: SqliteDialect,
    storage: props.db_url,
    models: [VRChatWorldJoinLogModel, VRChatPlayerJoinLogModel, Migrations],
  };
  log.info(`sequelizeOptions: ${JSON.stringify(sequelizeOptions)}`);
  const client = new Sequelize(sequelizeOptions);
  return {
    __db_url: props.db_url,
    __client: client,
  };
};

export const initRDBClient = (props: { db_url: string }) => {
  if (rdbClient !== null) {
    if (rdbClient.__db_url !== props.db_url) {
      throw new Error(
        `rdbClient is already initialized with ${rdbClient.__db_url}`,
      );
    }
    return rdbClient;
  }
  rdbClient = _getRDBClient({
    db_url: props.db_url,
  });
  return rdbClient;
};

export const getRDBClient = () => {
  if (rdbClient === null) {
    throw new Error('rdbClient is not initialized');
  }
  return rdbClient;
};

export const syncRDBClient = async (options?: {
  // migration の必要性を確認せず実行する
  checkRequired: boolean;
}) => {
  const appVersion = await settingService.getAppVersion();

  // 実行中は何もしない
  if (migrationProgeress) {
    log.info('migrationProgeress');
    return;
  }

  // デフォルトは確認してから実行
  const checkRequired = options?.checkRequired ?? true;

  const migrationRequired = match(checkRequired)
    .with(true, async () => await checkMigrationRDBClient(appVersion))
    .with(false, () => true);

  if (!migrationRequired) {
    return;
  }

  await resetRDB(appVersion);
};

const resetRDB = async (appVersion: string) => {
  migrationProgeress = true;
  try {
    // migration 実行
    const result = await getRDBClient().__client.sync({
      force: true,
      alter: true,
    });
    log.info('forceSyncRDB', result.options);

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
