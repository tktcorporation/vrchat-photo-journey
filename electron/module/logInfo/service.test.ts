import path from 'node:path';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../lib/sequelize';
import { getAppUserDataPath } from '../../lib/wrappedApp';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatPlayerLeaveLogModel } from '../VRChatPlayerLeaveLogModel/playerLeaveLog.model';
import * as playerLeaveLogService from '../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import { VRChatLogStoreFilePathSchema } from '../vrchatLog/model';
import type {
  VRChatPlayerJoinLog,
  VRChatWorldJoinLog,
} from '../vrchatLog/service';
import * as vrchatLogService from '../vrchatLog/service';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { loadLogInfoIndexFromVRChatLog } from './service';

// 必要最小限のモックを設定
vi.mock('../vrchatLog/service', () => ({
  importLogLinesFromLogPhotoDirPath: vi.fn().mockResolvedValue(undefined),
  getLogStoreFilePathsInRange: vi
    .fn()
    .mockImplementation(async (startDate: Date, _currentDate: Date) => {
      const mockPath = `/mock/path/${datefns.format(startDate, 'yyyy-MM')}.txt`;
      return [VRChatLogStoreFilePathSchema.parse(mockPath)];
    }),
  getVRChaLogInfoByLogFilePathList: vi.fn(),
  getLegacyLogStoreFilePath: vi.fn().mockResolvedValue(null),
}));

vi.mock('../vrchatWorldJoinLog/service', () => ({
  findLatestWorldJoinLog: vi.fn().mockResolvedValue(null),
  createVRChatWorldJoinLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service', () => ({
  findLatestPlayerJoinLog: vi.fn().mockResolvedValue(neverthrow.ok(null)),
  createVRChatPlayerJoinLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../VRChatPlayerLeaveLogModel/playerLeaveLog.service', () => ({
  findLatestPlayerLeaveLog: vi.fn().mockResolvedValue(null),
  createVRChatPlayerLeaveLogModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('../vrchatPhoto/vrchatPhoto.service', () => ({
  getVRChatPhotoDirPath: vi.fn().mockResolvedValue({ value: '/mock/photos' }),
  getLatestPhotoDate: vi.fn().mockResolvedValue(null),
  createVRChatPhotoPathIndex: vi.fn().mockResolvedValue([]),
}));

describe('loadLogInfoIndexFromVRChatLog', () => {
  beforeEach(() => {
    // getVRChaLogInfoByLogFilePathList のモックを設定
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok([]));

    // getLegacyLogStoreFilePath のモックを設定
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockReturnValue(
      Promise.resolve(
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore/logStore.txt'),
        ),
      ),
    );

    // 現在の日付をモック
    const mockDate = new Date('2024-03-20T00:00:00Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeAll(async () => {
    client.__initTestRDBClient();
  }, 10000);

  beforeEach(async () => {
    await client.__forceSyncRDBClient();
    vi.resetAllMocks();

    // importLogLinesFromLogPhotoDirPathのモックを設定
    vi.mocked(
      vrchatLogService.importLogLinesFromLogPhotoDirPath,
    ).mockResolvedValue();
  });

  afterAll(async () => {
    await client.__cleanupTestRDBClient();
  });

  it('should process only new logs after latest DB record', async () => {
    // モックの準備
    const latestWorldJoinDate = new Date('2024-01-01T00:00:00Z');
    const latestPlayerJoinDate = new Date('2024-01-01T00:00:00Z');

    const mockWorldJoinLog = {
      id: '1',
      worldId: 'wrld_12345678-1234-1234-1234-123456789012',
      worldName: 'World 1',
      worldInstanceId: 'instance1',
      joinDateTime: latestWorldJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatWorldJoinLogModel;

    const mockPlayerJoinLog = {
      id: '1',
      playerId: 'player1',
      playerName: 'Player 1',
      joinDateTime: latestPlayerJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatPlayerJoinLogModel;

    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      mockWorldJoinLog,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(mockPlayerJoinLog),
    );

    // テストデータの準備（古いログと新しいログの混在）
    const oldWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      worldId: 'wrld_old_world',
      worldName: 'Old World',
      worldInstanceId: 'oldInstance',
    };

    const newWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      worldId: 'wrld_new_world',
      worldName: 'New World',
      worldInstanceId: 'newInstance',
    };

    const oldPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      playerName: 'Old Player',
      playerId: null,
    };

    const newPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      playerName: 'New Player',
      playerId: `usr_${uuidv4()}`,
    };

    const mockLogs = [
      oldWorldJoinLog,
      newWorldJoinLog,
      oldPlayerJoinLog,
      newPlayerJoinLog,
    ];

    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok(mockLogs));

    // テスト実行
    const result = await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: true,
    });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.createdWorldJoinLogModelList).toHaveLength(1);
      expect(result.value.createdPlayerJoinLogModelList).toHaveLength(1);
      expect(result.value.createdPlayerLeaveLogModelList).toHaveLength(0);
    }
  });

  it('should process logs in batches of 1000', async () => {
    // 大量のログデータを生成
    const logsCount = 2500;
    const mockLogs = Array.from(
      { length: logsCount },
      (_, i) =>
        ({
          logType: 'worldJoin' as const,
          joinDate: new Date(`2024-01-01T${String(i).padStart(2, '0')}:00:00Z`),
          worldId: `wrld_${i
            .toString()
            .padStart(8, '0')}-0000-0000-0000-000000000000`,
          worldName: `World ${i}`,
          worldInstanceId: `instance${i}`,
        }) as VRChatWorldJoinLog,
    );

    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok(mockLogs));

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: true,
    });

    // バッチ処理の回数を検証（2500件なので3回のバッチ処理が必要）
    expect(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).toHaveBeenCalledTimes(3);

    // 各バッチのサイズを検証
    const calls = vi.mocked(worldJoinLogService.createVRChatWorldJoinLogModel)
      .mock.calls;
    expect(calls[0][0]).toHaveLength(1000); // 1回目: 1000件
    expect(calls[1][0]).toHaveLength(1000); // 2回目: 1000件
    expect(calls[2][0]).toHaveLength(500); // 3回目: 500件
  });

  it('should process world joins and player joins in parallel', async () => {
    const worldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      worldId: 'wrld_12345678-1234-1234-1234-123456789012',
      worldName: 'World 1',
      worldInstanceId: 'instance1',
    };

    const playerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      playerName: 'Player 1',
      playerId: 'usr_12345678-1234-1234-1234-123456789012',
    };

    const mockLogs = [worldJoinLog, playerJoinLog];

    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok(mockLogs));
    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      null,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(null),
    );

    const worldJoinDelay = 100;
    const playerJoinDelay = 50;

    vi.mocked(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, worldJoinDelay));
      return [];
    });

    vi.mocked(
      playerJoinLogService.createVRChatPlayerJoinLogModel,
    ).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, playerJoinDelay));
      return [];
    });

    // テスト実行開始時刻を記録
    const startTime = Date.now();
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: true,
    });
    const endTime = Date.now();

    // 並列処理の場合、総実行時間は最も遅い処理（worldJoinDelay）とほぼ同じになるはず
    // マージンとして20ms追加
    expect(endTime - startTime).toBeLessThan(worldJoinDelay + 20);
  });

  it('should process all logs when excludeOldLogLoad is false', async () => {
    // モックの準備
    const latestWorldJoinDate = new Date('2024-01-01T00:00:00Z');
    const latestPlayerJoinDate = new Date('2024-01-01T00:00:00Z');

    const mockWorldJoinLog = {
      id: '1',
      worldId: 'wrld_12345678-1234-1234-1234-123456789012',
      worldName: 'World 1',
      worldInstanceId: 'instance1',
      joinDateTime: latestWorldJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatWorldJoinLogModel;

    const mockPlayerJoinLog = {
      id: '1',
      playerId: 'player1',
      playerName: 'Player 1',
      joinDateTime: latestPlayerJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatPlayerJoinLogModel;

    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      mockWorldJoinLog,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(mockPlayerJoinLog),
    );

    // テストデータの準備（古いログと新しいログの混在）
    const oldWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      worldId: 'wrld_old_world',
      worldName: 'Old World',
      worldInstanceId: 'oldInstance',
    };

    const newWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      worldId: 'wrld_new_world',
      worldName: 'New World',
      worldInstanceId: 'newInstance',
    };

    const oldPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      playerName: 'Old Player',
      playerId: `usr_${uuidv4()}`,
    };

    const newPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      playerName: 'New Player',
      playerId: `usr_${uuidv4()}`,
    };

    const mockLogs = [
      oldWorldJoinLog,
      newWorldJoinLog,
      oldPlayerJoinLog,
      newPlayerJoinLog,
    ];

    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok(mockLogs));

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: false,
    });

    // 検証：古いログと新しいログの両方が処理されることを確認
    expect(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          worldId: oldWorldJoinLog.worldId,
          worldName: oldWorldJoinLog.worldName,
          joinDate: oldWorldJoinLog.joinDate,
        }),
        expect.objectContaining({
          worldId: newWorldJoinLog.worldId,
          worldName: newWorldJoinLog.worldName,
          joinDate: newWorldJoinLog.joinDate,
        }),
      ]),
    );

    expect(
      playerJoinLogService.createVRChatPlayerJoinLogModel,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          playerName: oldPlayerJoinLog.playerName,
          joinDate: oldPlayerJoinLog.joinDate,
        }),
        expect.objectContaining({
          playerName: newPlayerJoinLog.playerName,
          joinDate: newPlayerJoinLog.joinDate,
        }),
      ]),
    );
  });

  it('日付範囲に基づいて適切なログファイルパスを取得する', async () => {
    // モックの準備
    const latestWorldJoinDate = new Date('2024-03-15T00:00:00Z');
    const latestPlayerJoinDate = new Date('2024-03-10T00:00:00Z');
    const latestPlayerLeaveDate = new Date('2024-03-20T00:00:00Z');

    const mockWorldJoinLog = {
      id: '1',
      worldId: 'wrld_12345678-1234-1234-1234-123456789012',
      worldName: 'World 1',
      worldInstanceId: 'instance1',
      joinDateTime: latestWorldJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatWorldJoinLogModel;

    const mockPlayerJoinLog = {
      id: '1',
      playerId: 'player1',
      playerName: 'Player 1',
      joinDateTime: latestPlayerJoinDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as VRChatPlayerJoinLogModel;

    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      mockWorldJoinLog,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(mockPlayerJoinLog),
    );
    vi.mocked(playerLeaveLogService.findLatestPlayerLeaveLog).mockResolvedValue(
      {
        id: '1',
        playerId: 'player1',
        playerName: 'Player 1',
        leaveDateTime: latestPlayerLeaveDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as VRChatPlayerLeaveLogModel,
    );

    // getLogStoreFilePathsInRangeのモックを設定
    const mockLogFilePaths = [
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2024-03/logStore-2024-03.txt',
      ),
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2024-04/logStore-2024-04.txt',
      ),
    ];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockReturnValue(
      Promise.resolve([
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore', '2024-03.txt'),
        ),
      ]),
    );

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: true,
    });

    // 検証
    // 最も古い日付（3月10日）の月の初日（3月1日）から取得されることを確認
    expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalledWith(
      expect.any(Date),
    );

    // 呼び出し引数を取得
    const callArg = vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mock
      .calls[0][0];

    // 3月1日であることを確認（月の初日）
    expect(datefns.getMonth(callArg)).toBe(2); // 0-indexed: 3月は2
    expect(datefns.getDate(callArg)).toBe(1);

    // 正しいログファイルパスリストが使用されたことを確認
    expect(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).toHaveBeenCalledWith(mockLogFilePaths);
  });

  it('DBに記録がない場合は1年前からログを取得する', async () => {
    // DBに記録がないケース
    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      null,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(null),
    );
    vi.mocked(playerLeaveLogService.findLatestPlayerLeaveLog).mockResolvedValue(
      null,
    );

    // getLogStoreFilePathsInRangeのモックを設定
    const _mockLogFilePaths = [
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2023-05/logStore-2023-05.txt',
      ),
    ];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockReturnValue(
      Promise.resolve([
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore', '2023-05.txt'),
        ),
      ]),
    );

    // 現在の日付を固定
    const fixedDate = new Date('2024-05-15T00:00:00Z');
    const originalNow = Date.now;

    // Date.nowをモック
    global.Date.now = vi.fn(() => fixedDate.getTime());

    // Dateコンストラクタをモック
    const RealDate = global.Date;
    const mockDateConstructor = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(fixedDate);
      }
      // 型アサーションを使用して引数を渡す
      return new RealDate(...(args as [string | number | Date]));
    } as unknown as DateConstructor;

    // 元のDate.UTCとDate.parseを保持
    mockDateConstructor.UTC = RealDate.UTC;
    mockDateConstructor.parse = RealDate.parse;

    // Dateをモック
    global.Date = mockDateConstructor;

    try {
      // テスト実行
      await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: true,
      });

      // 検証
      // 1年前からログを取得することを確認
      expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalled();

      // 呼び出し引数を取得
      const callArg = vi.mocked(vrchatLogService.getLogStoreFilePathsInRange)
        .mock.calls[0][0];

      // 1年前の日付であることを確認
      const oneYearAgo = datefns.subYears(fixedDate, 1);
      expect(datefns.getYear(callArg)).toBe(datefns.getYear(oneYearAgo));
      expect(datefns.getMonth(callArg)).toBe(datefns.getMonth(oneYearAgo));
    } finally {
      // モックをリセット
      global.Date = RealDate;
      global.Date.now = originalNow;
    }
  });

  it('excludeOldLogLoadがfalseの場合は2000年1月1日からすべてのログを取得し、現在の日付のログファイルも含める', async () => {
    // getLogStoreFilePathsInRangeのモックを設定
    const mockLogFilePaths = [
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2000-01/logStore-2000-01.txt',
      ),
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2000-02/logStore-2000-02.txt',
      ),
    ];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockReturnValue(
      Promise.resolve([
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore', '2000-01.txt'),
        ),
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore', '2000-02.txt'),
        ),
      ]),
    );

    // getLegacyLogStoreFilePathのモックを設定
    const currentLogFilePath = VRChatLogStoreFilePathSchema.parse(
      '/mock/path/logStore/current/logStore-current.txt',
    );
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockReturnValue(
      Promise.resolve(
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore/logStore.txt'),
        ),
      ),
    );

    // getVRChaLogInfoByLogFilePathListのモックを設定
    const expectedLogFilePaths = [...mockLogFilePaths, currentLogFilePath];
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok([]));

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: false,
    });

    // 検証
    // 2000年1月1日からログを取得することを確認
    expect(vrchatLogService.getLogStoreFilePathsInRange).toHaveBeenCalledWith(
      expect.any(Date),
    );

    // 呼び出し引数を取得
    const callArg = vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mock
      .calls[0][0];

    // 2000年1月1日であることを確認
    expect(datefns.getYear(callArg)).toBe(2000);
    expect(datefns.getMonth(callArg)).toBe(0); // 0-indexed: 1月は0
    expect(datefns.getDate(callArg)).toBe(1);

    // getLegacyLogStoreFilePathが呼ばれたことを確認
    expect(vrchatLogService.getLegacyLogStoreFilePath).toHaveBeenCalled();

    // getVRChaLogInfoByLogFilePathListに正しいパラメータが渡されたことを確認
    expect(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).toHaveBeenCalledWith(expectedLogFilePaths);
  });

  it('excludeOldLogLoadがfalseの場合、getLegacyLogStoreFilePathで取得したパスが既に含まれている場合は重複して追加しない', async () => {
    // getLogStoreFilePathsInRangeのモックを設定
    const duplicateLogFilePath = VRChatLogStoreFilePathSchema.parse(
      '/mock/path/logStore/current/logStore-current.txt',
    );
    const mockLogFilePaths = [
      VRChatLogStoreFilePathSchema.parse(
        '/mock/path/logStore/2000-01/logStore-2000-01.txt',
      ),
      duplicateLogFilePath, // 重複するパス
    ];
    vi.mocked(vrchatLogService.getLogStoreFilePathsInRange).mockReturnValue(
      Promise.resolve([
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore', '2000-01.txt'),
        ),
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore/logStore.txt'),
        ),
      ]),
    );

    // getLegacyLogStoreFilePathのモックを設定 - 既に含まれているパスと同じものを返す
    vi.mocked(vrchatLogService.getLegacyLogStoreFilePath).mockReturnValue(
      Promise.resolve(
        VRChatLogStoreFilePathSchema.parse(
          path.join(getAppUserDataPath(), 'logStore/logStore.txt'),
        ),
      ),
    );

    // getVRChaLogInfoByLogFilePathListのモックを設定
    vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mockResolvedValue(neverthrow.ok([]));

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: false,
    });

    // 検証
    // getLegacyLogStoreFilePathが呼ばれたことを確認
    expect(vrchatLogService.getLegacyLogStoreFilePath).toHaveBeenCalled();

    // getVRChaLogInfoByLogFilePathListに渡されたパスリストに重複がないことを確認
    expect(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).toHaveBeenCalledWith(
      mockLogFilePaths, // 重複が排除されているので、元のmockLogFilePathsと同じになるはず
    );

    // 呼び出し引数を取得して重複がないことを確認
    const callArgs = vi.mocked(
      vrchatLogService.getVRChaLogInfoByLogFilePathList,
    ).mock.calls[0][0];

    // パスの数が元のmockLogFilePathsと同じであることを確認（重複が追加されていない）
    expect(callArgs.length).toBe(mockLogFilePaths.length);

    // 重複するパスが1回だけ含まれていることを確認
    const duplicatePaths = callArgs.filter(
      (path) => path === duplicateLogFilePath,
    );
    expect(duplicatePaths.length).toBe(1);
  });
});
