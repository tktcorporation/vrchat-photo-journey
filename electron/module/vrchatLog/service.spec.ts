import path from 'node:path';
import type * as neverthrow from 'neverthrow';
import type { VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import type { VRChatLogFileError } from './error';
import * as service from './service';

describe('getVRChaLogInfoFromLogPath', () => {
  interface VRChatWorldJoinLog {
    logType: 'worldJoin';
    joinDate: Date;
    worldId: string;
    worldInstanceId: string;
    worldName: string;
  }
  interface VRChatPlayerJoinLog {
    logType: 'playerJoin';
    joinDate: Date;
    playerName: string;
  }
  type GetVRChaLogInfoFromLogPath = (
    logFilesDir: VRChatLogFilesDirPath,
  ) => Promise<
    neverthrow.Result<
      (VRChatWorldJoinLog | VRChatPlayerJoinLog)[],
      VRChatLogFileError
    >
  >;
  it('should-return-VRChatWorldJoinLog[]', async () => {
    const getVRChaLogInfoFromLogPath: GetVRChaLogInfoFromLogPath =
      service.getVRChaLogInfoFromLogPath;
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    const result = await getVRChaLogInfoFromLogPath(
      storedVRChatLogFilesDirPath as unknown as VRChatLogFilesDirPath,
    );
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) {
      throw new Error('Unexpected error');
    }
    console.log(result.value);
    expect(result.value.length).toBeGreaterThan(0);
    for (const log of result.value) {
      expect(log.joinDate).toBeInstanceOf(Date);
      if (log.logType === 'playerJoin') {
        expect(log.playerName.length).toBeGreaterThan(0);
        continue;
      }
      if (log.logType === 'worldJoin') {
        expect(log.worldId).toMatch(
          /^wrld_[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/,
        );
        // 68738~hidden(usr_e3dd71aa-3469-439a-a90c-5b58738e92b9)~region(jp)
        // 91889~region(jp)
        expect(log.worldInstanceId).toMatch(/^[0-9]+~.+$/);
        expect(log.worldName.length).toBeGreaterThan(0);
        continue;
      }
      throw new Error('Unexpected log type');
    }
  });
});
