import path from 'node:path';
import type * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as fs from '../../lib/wrappedFs';
import type { VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import type { VRChatLogFileError } from './error';
import {
  VRChatLogLine,
  VRChatLogLineSchema,
  VRChatLogStoreFilePathSchema,
} from './model';
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

describe('appendLoglinesToFile', () => {
  it('should-return-void', async () => {
    const logStoreFilePath = VRChatLogStoreFilePathSchema.parse(
      path.join(process.cwd(), 'debug', 'logs-store', 'test.log'),
    );
    const unlinkResult = await fs.unlinkAsync(logStoreFilePath.value);
    if (unlinkResult.isErr()) {
      const isThrow = match(unlinkResult.error)
        .with({ code: 'ENOENT' }, () => false)
        .exhaustive();
      if (isThrow) {
        throw unlinkResult.error;
      }
    }

    const appendLoglinesToFile = service.appendLoglinesToFile;

    // Write log lines to file
    const logLines = [
      '2021.10.02 00:00:01 Log        -  Log message',
      '2021.10.02 00:00:02 Log        -  Log message',
      '2021.10.02 00:00:03 Log        -  Log message',
      '2021.10.02 00:00:04 Log        -  Log message',
    ].map((line) => VRChatLogLineSchema.parse(line));
    const result = await appendLoglinesToFile({
      logLines,
      logStoreFilePath,
    });

    expect(result.isOk()).toBe(true);

    const logStoreFileLines = fs.readFileSyncSafe(logStoreFilePath.value);
    if (logStoreFileLines.isErr()) {
      throw new Error('Unexpected error');
    }
    const loglineLength_1 = logStoreFileLines.value
      .toString()
      .split('\n').length;
    expect(loglineLength_1).toBeGreaterThanOrEqual(logLines.length);

    // Append log lines to file
    const logLines_2 = [
      '2021.10.03 00:00:01 Log        -  Log message 2',
      '2021.10.03 00:00:02 Log        -  Log message 2',
      '2021.10.03 00:00:03 Log        -  Log message 2',
      '2021.10.03 00:00:04 Log        -  Log message 2',
    ].map((line) => VRChatLogLineSchema.parse(line));
    const result_2 = await appendLoglinesToFile({
      logLines: logLines_2,
      logStoreFilePath,
    });

    expect(result_2.isOk()).toBe(true);

    const logStoreFileLines_2 = fs.readFileSyncSafe(logStoreFilePath.value);
    if (logStoreFileLines_2.isErr()) {
      throw new Error('Unexpected error');
    }

    const loglineLength_2 = logStoreFileLines_2.value
      .toString()
      .split('\n').length;
    expect(loglineLength_2).toBe(loglineLength_1 + logLines_2.length);

    // Append log lines to file duplicated
    const result_3 = await appendLoglinesToFile({
      logLines: logLines_2,
      logStoreFilePath,
    });

    expect(result_3.isOk()).toBe(true);

    const logStoreFileLines_3 = fs.readFileSyncSafe(logStoreFilePath.value);
    if (logStoreFileLines_3.isErr()) {
      throw new Error('Unexpected error');
    }

    const loglineLength_3 = logStoreFileLines_3.value
      .toString()
      .split('\n').length;
    expect(loglineLength_3).toBe(loglineLength_2);
  });
});
