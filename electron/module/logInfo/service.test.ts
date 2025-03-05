import * as neverthrow from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import * as client from '../../lib/sequelize';
import type { VRChatPlayerJoinLogModel } from '../VRChatPlayerJoinLogModel/playerJoinInfoLog.model';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type {
  VRChatPlayerJoinLog,
  VRChatWorldJoinLog,
} from '../vrchatLog/service';
import * as vrchatLogService from '../vrchatLog/service';
import * as vrchatPhotoService from '../vrchatPhoto/vrchatPhoto.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { loadLogInfoIndexFromVRChatLog } from './service';
vi.mock('../vrchatLog/service');
vi.mock('../vrchatWorldJoinLog/service');
vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
vi.mock('../vrchatPhoto/vrchatPhoto.service');

describe('loadLogInfoIndexFromVRChatLog', () => {
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
    vi.mocked(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).mockResolvedValue([]);
    vi.mocked(
      playerJoinLogService.createVRChatPlayerJoinLogModel,
    ).mockResolvedValue([]);
    vi.mocked(vrchatPhotoService.getLatestPhotoDate).mockResolvedValue(null);
    vi.mocked(vrchatPhotoService.createVRChatPhotoPathIndex).mockResolvedValue(
      [],
    );

    // テスト実行
    await loadLogInfoIndexFromVRChatLog({
      excludeOldLogLoad: true,
    });

    // 検証
    expect(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          worldId: newWorldJoinLog.worldId,
          joinDate: expect.any(Date),
        }),
      ]),
    );
    expect(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          worldId: oldWorldJoinLog.worldId,
          joinDate: expect.any(Date),
        }),
      ]),
    );
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
    vi.mocked(worldJoinLogService.findLatestWorldJoinLog).mockResolvedValue(
      null,
    );
    vi.mocked(playerJoinLogService.findLatestPlayerJoinLog).mockResolvedValue(
      neverthrow.ok(null),
    );
    vi.mocked(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).mockResolvedValue([]);
    vi.mocked(vrchatPhotoService.getLatestPhotoDate).mockResolvedValue(null);
    vi.mocked(vrchatPhotoService.createVRChatPhotoPathIndex).mockResolvedValue(
      [],
    );

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

    vi.mocked(vrchatPhotoService.getLatestPhotoDate).mockResolvedValue(null);
    vi.mocked(vrchatPhotoService.createVRChatPhotoPathIndex).mockResolvedValue(
      [],
    );

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
    vi.mocked(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).mockResolvedValue([]);
    vi.mocked(
      playerJoinLogService.createVRChatPlayerJoinLogModel,
    ).mockResolvedValue([]);
    vi.mocked(vrchatPhotoService.getLatestPhotoDate).mockResolvedValue(null);
    vi.mocked(vrchatPhotoService.createVRChatPhotoPathIndex).mockResolvedValue(
      [],
    );

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
});
