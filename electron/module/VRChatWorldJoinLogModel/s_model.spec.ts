import path from 'node:path';
import { type getSettingStore, initSettingStoreForTest } from '../settingStore';
import {
  type VRChatWorldJoinLog,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import { getValidVRChatLogFileDir } from '../vrchatLogFileDir/service';
import * as model from './s_model';

import * as client from '../../lib/sequelize';

const dbPath = path.join(process.cwd(), 'debug', 'db', 'test.sqlite');

describe('module/logInfo/s_model', () => {
  beforeAll(async () => {
    client.initRDBClient({
      db_url: dbPath,
    });
    // migrate db
    await client.syncRDBClient({
      checkRequired: false,
    });
  }, 10000);
  it('has a model', async () => {
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    initSettingStoreForTest({
      getLogFilesDir: () => storedVRChatLogFilesDirPath.value,
    } as unknown as ReturnType<typeof getSettingStore>);
    const logFilesDirPath = await getValidVRChatLogFileDir();
    if (logFilesDirPath.isErr()) {
      throw new Error('Unexpected error');
    }
    const logInfoList = await getVRChaLogInfoFromLogPath(
      logFilesDirPath.value.path,
    );
    if (logInfoList.isErr()) {
      throw new Error('Unexpected error');
    }
    const worldJoinLogList = logInfoList.value.filter(
      (logInfo): logInfo is VRChatWorldJoinLog =>
        logInfo.logType === 'worldJoin',
    );

    await model.createVRChatWorldJoinLog(worldJoinLogList);
  });
  it('findAllVRChatWorldJoinLogList', async () => {
    const result = await model.findAllVRChatWorldJoinLogList();
    expect(result.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await client.getRDBClient().__client.close();
  });
});
