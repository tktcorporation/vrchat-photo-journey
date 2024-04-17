import path from 'node:path';
import {
  type VRChatWorldJoinLog,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import type { VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import { getValidVRChatLogFileDir } from '../vrchatLogFileDir/service';
import * as model from './model';
import { resetDatabase } from './util';

const dbPath = path.join(process.cwd(), 'debug', 'db', 'test.db');

describe('module/logInfo/model', () => {
  beforeAll(async () => {
    // migrate prisma db
    await resetDatabase(dbPath);
  });
  it('has a model', async () => {
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    const logFilesDirPath = await getValidVRChatLogFileDir({
      storedVRChatLogFilesDirPath:
        storedVRChatLogFilesDirPath as unknown as VRChatLogFilesDirPath,
    });
    if (logFilesDirPath.isErr()) {
      throw new Error('Unexpected error');
    }
    const logInfoList = await getVRChaLogInfoFromLogPath(logFilesDirPath.value);
    if (logInfoList.isErr()) {
      throw new Error('Unexpected error');
    }
    const worldJoinLogList = logInfoList.value.filter(
      (logInfo): logInfo is VRChatWorldJoinLog =>
        logInfo.logType === 'worldJoin',
    );

    const client = model.getRDBClient(dbPath);
    await client.createVRChatWorldJoinLog(worldJoinLogList);
  });
  it('findAllVRChatWorldJoinLogList', async () => {
    const client = model.getRDBClient(dbPath);
    const result = await client.findAllVRChatWorldJoinLogList();
    expect(result.length).toBeGreaterThan(0);
  });
});
