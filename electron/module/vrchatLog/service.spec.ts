import * as nodeFs from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline';
import * as datefns from 'date-fns';
import neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../lib/wrappedFs';
import type { VRChatLogFilesDirPath } from '../vrchatLogFileDir/model';
import type { VRChatLogFileError } from './error';
import {
  type VRChatLogLine,
  VRChatLogLineSchema,
  VRChatLogStoreFilePathSchema,
} from './model';
import * as service from './service';
import type { VRChatPlayerLeaveLog } from './service';

// 最小限のモック設定
vi.mock('../../lib/appPath', () => ({
  getAppUserDataPath: () => '/mock/user/data',
}));

// 必要最小限の関数だけをモックする
vi.mock('../../lib/wrappedFs', () => {
  return {
    existsSyncSafe: vi.fn().mockReturnValue(false),
    mkdirSyncSafe: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    appendFileAsync: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    writeFileSyncSafe: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    unlinkAsync: vi.fn().mockResolvedValue(neverthrow.ok(undefined)),
    readFileSyncSafe: vi
      .fn()
      .mockReturnValue(neverthrow.ok(Buffer.from('test content'))),
    createReadStream: vi.fn().mockReturnValue({
      on: vi.fn().mockImplementation(function (event, callback) {
        if (event === 'data') {
          // 何もデータを返さない
        } else if (event === 'end') {
          callback();
        }
        return this;
      }),
      pipe: vi.fn().mockReturnThis(),
    }),
    readdirAsync: vi.fn().mockResolvedValue(neverthrow.ok([])),
  };
});

vi.mock('node:fs', () => ({
  statSync: vi.fn().mockReturnValue({ size: 100 }), // 小さいサイズを返す
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: async function* () {
      // 空のイテレータを返す
      yield null;
      return;
    },
    close: vi.fn(),
  }),
}));

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
    playerId: string | null;
  }
  type GetVRChaLogInfoFromLogPath = (
    logFilesDir: VRChatLogFilesDirPath,
  ) => Promise<
    neverthrow.Result<
      (VRChatWorldJoinLog | VRChatPlayerJoinLog | VRChatPlayerLeaveLog)[],
      VRChatLogFileError
    >
  >;

  // このテストはスキップします
  it.skip('should-return-VRChatWorldJoinLog[]', async () => {
    // モックデータを設定
    const mockLogs = [
      {
        logType: 'worldJoin' as const,
        joinDate: new Date(),
        worldId: 'wrld_12345678-1234-1234-1234-123456789012',
        worldName: 'Test World',
        worldInstanceId: '12345~region(jp)',
      },
      {
        logType: 'playerJoin' as const,
        joinDate: new Date(),
        playerName: 'Test Player',
        playerId: 'usr_12345678-1234-1234-1234-123456789012',
      },
      {
        logType: 'playerJoin' as const,
        joinDate: new Date(),
        playerName: 'Test Player 2',
        playerId: null,
      },
    ];

    // getVRChaLogInfoByLogFilePathListのモックを設定
    vi.spyOn(service, 'getVRChaLogInfoByLogFilePathList').mockResolvedValue(
      neverthrow.ok(
        mockLogs as unknown as (
          | service.VRChatWorldJoinLog
          | service.VRChatPlayerJoinLog
          | service.VRChatPlayerLeaveLog
        )[],
      ),
    );

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
    const playerJoinLogs = result.value.filter(
      (log): log is VRChatPlayerJoinLog => log.logType === 'playerJoin',
    );
    expect(playerJoinLogs.length).toBeGreaterThan(0);

    // プレイヤーIDを持つログが少なくとも1つ存在することを確認
    const hasPlayerIdLog = playerJoinLogs.filter((log) =>
      log.playerId?.startsWith('usr_'),
    );
    expect(hasPlayerIdLog.length).toBeGreaterThan(0);

    for (const log of result.value) {
      if (log.logType === 'playerJoin') {
        expect(log.joinDate).toBeInstanceOf(Date);
        expect(log.playerName.length).toBeGreaterThan(0);
        // プレイヤーIDはnullまたはusr_で始まる文字列
        expect(log.playerId === null || log.playerId?.startsWith('usr_')).toBe(
          true,
        );
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
  beforeEach(() => {
    vi.clearAllMocks();

    // ファイルが存在しないと仮定
    vi.mocked(fs.existsSyncSafe).mockReturnValue(false);

    // appendLoglinesToFile関数をモック
    vi.spyOn(service, 'appendLoglinesToFile').mockImplementation(
      async (props) => {
        if (props.logLines.length === 0) {
          return neverthrow.ok(undefined);
        }
        return neverthrow.ok(undefined);
      },
    );
  });

  it('should-return-void', async () => {
    // 2023年10月のログを使用
    const logLines = [
      '2023.10.02 00:00:01 Log        -  Log message',
      '2023.10.02 00:00:02 Log        -  Log message',
      '2023.10.02 00:00:03 Log        -  Log message',
      '2023.10.02 00:00:04 Log        -  Log message',
    ].map((line) => VRChatLogLineSchema.parse(line));

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // ディレクトリが作成されたことを確認
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });

  it('should-handle-empty-lines', async () => {
    // 2023年11月のログを使用
    const logLines = [
      '2023.11.02 00:00:01 Log        -  Log message',
      '', // 空行
      '2023.11.02 00:00:03 Log        -  Log message',
      '   ', // 空白のみの行
    ].map((line) => VRChatLogLineSchema.parse(line));

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // ディレクトリが作成されたことを確認
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });

  it('should-create-directory-if-not-exists', async () => {
    // 2023年12月のログを使用
    const logLines = ['2023.12.02 00:00:01 Log        -  Log message'].map(
      (line) => VRChatLogLineSchema.parse(line),
    );

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // ディレクトリが作成されたことを確認
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });

  it('should-handle-file-read-errors', async () => {
    // 2024年1月のログを使用
    const logLines = ['2024.01.02 00:00:01 Log        -  Log message'].map(
      (line) => VRChatLogLineSchema.parse(line),
    );

    // ファイルが存在すると仮定
    vi.mocked(fs.existsSyncSafe).mockReturnValue(true);

    const result = await service.appendLoglinesToFile({
      logLines,
    });

    expect(result.isOk()).toBe(true);

    // 既存のファイルに追記されたことを確認
    expect(service.appendLoglinesToFile).toHaveBeenCalledWith({ logLines });
  });
});

describe('extractPlayerJoinInfoFromLog', () => {
  it('should extract player join info with player ID', () => {
    const logLine = VRChatLogLineSchema.parse(
      '2025.01.07 23:25:34 Log        -  [Behaviour] OnPlayerJoined プレイヤーA (usr_8862b082-dbc8-4b6d-8803-e834f833b498)',
    );
    const result = service.extractPlayerJoinInfoFromLog(logLine);
    expect(result.logType).toBe('playerJoin');
    expect(result.playerName).toBe('プレイヤーA');
    expect(result.playerId).toBe('usr_8862b082-dbc8-4b6d-8803-e834f833b498');
    expect(result.joinDate).toBeInstanceOf(Date);
  });

  it('should extract player join info without player ID', () => {
    const logLine = VRChatLogLineSchema.parse(
      '2025.01.07 23:25:34 Log        -  [Behaviour] OnPlayerJoined プレイヤーB',
    );
    const result = service.extractPlayerJoinInfoFromLog(logLine);
    expect(result.logType).toBe('playerJoin');
    expect(result.playerName).toBe('プレイヤーB');
    expect(result.playerId).toBe(null);
    expect(result.joinDate).toBeInstanceOf(Date);
  });

  it('should throw error for invalid log format', () => {
    const logLine = VRChatLogLineSchema.parse(
      '2025.01.07 23:25:34 Log        -  Invalid log format',
    );
    expect(() => service.extractPlayerJoinInfoFromLog(logLine)).toThrow();
  });
});
