import path from 'node:path';
import { type getSettingStore, initSettingStoreForTest } from '../settingStore';
import {
  type VRChatWorldJoinLog,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import { getValidVRChatLogFileDir } from '../vrchatLogFileDir/service';
import * as model from './model';
import { resetDatabase } from './util';

const dbPath = path.join('file://', process.cwd(), 'debug', 'db', 'test.db');

describe('module/logInfo/model', () => {
  beforeAll(async () => {
    model.initRDBClient({
      db_url: dbPath,
    });
    // migrate prisma db
    await resetDatabase();
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

    const client = model.getRDBClient();
    await client.createVRChatWorldJoinLog(worldJoinLogList);
  });
  it('findAllVRChatWorldJoinLogList', async () => {
    const client = model.getRDBClient();
    const result = await client.findAllVRChatWorldJoinLogList();
    expect(result.length).toBeGreaterThan(0);
  });
});
