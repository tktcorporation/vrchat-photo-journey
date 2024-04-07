import path from 'node:path';
import {
  type VRChatWorldJoinLog,
  getVRChaLogInfoFromLogPath,
} from '../vrchatLog/service';
import type { VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import { getValidVRChatLogFileDir } from '../vrchatLogFileDir/service';
import * as model from './model';

describe('module/logInfo/model', () => {
  it('has a model', async () => {
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    const logFilesDirPath = getValidVRChatLogFileDir({
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

    await model.createVRChatWorldJoinLog(worldJoinLogList);
  });
  it('findAllVRChatWorldJoinLogList', async () => {
    const result = await model.findAllVRChatWorldJoinLogList();
    expect(result.length).toBeGreaterThan(0);
  });
});
