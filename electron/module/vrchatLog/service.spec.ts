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
import type { VRChatPlayerLeaveLog } from './service';

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
      (VRChatWorldJoinLog | VRChatPlayerJoinLog | VRChatPlayerLeaveLog)[],
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
      if (log.logType === 'playerJoin') {
        expect(log.joinDate).toBeInstanceOf(Date);
        expect(log.playerName.length).toBeGreaterThan(0);
        continue;
      }
      if (log.logType === 'worldJoin') {
        expect(log.joinDate).toBeInstanceOf(Date);
        expect(log.worldId).toMatch(
          /^wrld_[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/,
        );
        // 68738~hidden(usr_e3dd71aa-3469-439a-a90c-5b58738e92b9)~region(jp)
        // 91889~region(jp)
        expect(log.worldInstanceId).toMatch(/^[0-9]+~.+$/);
        expect(log.worldName.length).toBeGreaterThan(0);
        continue;
      }
      if (log.logType === 'playerLeave') {
        expect(log.leaveDate).toBeInstanceOf(Date);
        expect(log.playerName.length).toBeGreaterThan(0);
        continue;
      }
      throw new Error('Unexpected log type');
    }
  });
});

describe('appendLoglinesToFile', () => {
  const TEST_LOG_PATH = path.join(
    process.cwd(),
    'debug',
    'logs-store',
    'test.log',
  );

  beforeEach(async () => {
    // テスト前にファイルを削除
    const unlinkResult = await fs.unlinkAsync(TEST_LOG_PATH);
    if (unlinkResult.isErr()) {
      const isThrow = match(unlinkResult.error)
        .with({ code: 'ENOENT' }, () => false)
        .exhaustive();
      if (isThrow) {
        throw unlinkResult.error;
      }
    }
  });

  it('should-return-void', async () => {
    const logStoreFilePath = VRChatLogStoreFilePathSchema.parse(TEST_LOG_PATH);
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

  it('should-handle-empty-lines', async () => {
    const logStoreFilePath = VRChatLogStoreFilePathSchema.parse(TEST_LOG_PATH);
    const appendLoglinesToFile = service.appendLoglinesToFile;

    const logLines = [
      '2021.10.02 00:00:01 Log        -  Log message',
      '', // 空行
      '2021.10.02 00:00:03 Log        -  Log message',
      '   ', // 空白のみの行
    ].map((line) => VRChatLogLineSchema.parse(line));

    const result = await appendLoglinesToFile({
      logLines,
      logStoreFilePath,
    });

    expect(result.isOk()).toBe(true);

    const logStoreFileLines = fs.readFileSyncSafe(logStoreFilePath.value);
    expect(logStoreFileLines.isOk()).toBe(true);
    if (logStoreFileLines.isOk()) {
      const lines = logStoreFileLines.value
        .toString()
        .split('\n')
        .filter((line) => line.trim());
      expect(lines.length).toBe(2); // 空行が除外されていることを確認
    }
  });

  it('should-create-directory-if-not-exists', async () => {
    const newDirPath = path.join(process.cwd(), 'debug', 'new-test-dir');
    const logStoreFilePath = VRChatLogStoreFilePathSchema.parse(
      path.join(newDirPath, 'test.log'),
    );

    const logLines = ['2021.10.02 00:00:01 Log        -  Log message'].map(
      (line) => VRChatLogLineSchema.parse(line),
    );

    const result = await service.appendLoglinesToFile({
      logLines,
      logStoreFilePath,
    });

    expect(result.isOk()).toBe(true);

    // ディレクトリとファイルが作成されたことを確認
    const exists = await fs.existsSyncSafe(logStoreFilePath.value);
    expect(exists).toBe(true);

    // 後処理
    const unlinkResult = await fs.unlinkAsync(logStoreFilePath.value);
    expect(unlinkResult.isOk()).toBe(true);
  });

  it('should-handle-file-read-errors', async () => {
    const logStoreFilePath = VRChatLogStoreFilePathSchema.parse(TEST_LOG_PATH);

    // 空のファイルを作成
    await fs.writeFileSyncSafe(TEST_LOG_PATH, '');

    const logLines = ['2021.10.02 00:00:01 Log        -  Log message'].map(
      (line) => VRChatLogLineSchema.parse(line),
    );

    const result = await service.appendLoglinesToFile({
      logLines,
      logStoreFilePath,
    });

    // エラーハンドリングの確認（ファイルの存在チェック）
    const exists = await fs.existsSyncSafe(logStoreFilePath.value);
    expect(exists).toBe(true);

    // 書き込みが成功したことを確認
    expect(result.isOk()).toBe(true);
  });
});
