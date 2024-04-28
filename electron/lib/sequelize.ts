import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import { VRChatWorldJoinLogModel } from '../module/logInfo/s_model';

let rdbClient: ReturnType<typeof _getRDBClient> | null = null;

const _getRDBClient = (props: { db_url: string }) => {
  const client = new Sequelize({
    dialect: SqliteDialect,
    storage: props.db_url,
    models: [VRChatWorldJoinLogModel],
  });
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

export const syncForceRDBClient = async () => {
  if (rdbClient === null) {
    throw new Error('rdbClient is not initialized');
  }
  await rdbClient.__client.sync({ force: true });
};
