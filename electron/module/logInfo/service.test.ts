import * as neverthrow from 'neverthrow';
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

jest.mock('../vrchatLog/service');
jest.mock('../vrchatWorldJoinLog/service');
jest.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
jest.mock('../vrchatPhoto/vrchatPhoto.service');

describe('loadLogInfoIndexFromVRChatLog', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

    (worldJoinLogService.findLatestWorldJoinLog as jest.Mock).mockResolvedValue(
      mockWorldJoinLog,
    );
    (
      playerJoinLogService.findLatestPlayerJoinLog as jest.Mock
    ).mockResolvedValue(mockPlayerJoinLog);

    // テストデータの準備（古いログと新しいログの混在）
    const oldWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      worldId: 'wrld_12345678-1234-1234-1234-123456789012',
      worldName: 'Old World',
      worldInstanceId: 'oldInstance',
    };

    const newWorldJoinLog: VRChatWorldJoinLog = {
      logType: 'worldJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      worldId: 'wrld_87654321-4321-4321-4321-210987654321',
      worldName: 'New World',
      worldInstanceId: 'newInstance',
    };

    const oldPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2023-12-31T00:00:00Z'),
      playerName: 'Old Player',
    };

    const newPlayerJoinLog: VRChatPlayerJoinLog = {
      logType: 'playerJoin',
      joinDate: new Date('2024-01-02T00:00:00Z'),
      playerName: 'New Player',
    };

    const mockLogs = neverthrow.ok([
      oldWorldJoinLog,
      newWorldJoinLog,
      oldPlayerJoinLog,
      newPlayerJoinLog,
    ]);

    (
      vrchatLogService.getVRChaLogInfoByLogFilePathList as jest.Mock
    ).mockResolvedValue(mockLogs);
    (
      worldJoinLogService.createVRChatWorldJoinLogModel as jest.Mock
    ).mockResolvedValue([]);
    (
      playerJoinLogService.createVRChatPlayerJoinLogModel as jest.Mock
    ).mockResolvedValue([]);
    (vrchatPhotoService.getLatestPhotoDate as jest.Mock).mockResolvedValue(
      null,
    );
    (
      vrchatPhotoService.createVRChatPhotoPathIndex as jest.Mock
    ).mockResolvedValue([]);

    // テスト実行
    const _result = await loadLogInfoIndexFromVRChatLog();

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
    const mockLogs = neverthrow.ok(
      Array.from(
        { length: logsCount },
        (_, i) =>
          ({
            logType: 'worldJoin' as const,
            joinDate: new Date(
              `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
            ),
            worldId: `wrld_${i
              .toString()
              .padStart(8, '0')}-0000-0000-0000-000000000000`,
            worldName: `World ${i}`,
            worldInstanceId: `instance${i}`,
          }) as VRChatWorldJoinLog,
      ),
    );

    (
      vrchatLogService.getVRChaLogInfoByLogFilePathList as jest.Mock
    ).mockResolvedValue(mockLogs);
    (worldJoinLogService.findLatestWorldJoinLog as jest.Mock).mockResolvedValue(
      null,
    );
    (
      playerJoinLogService.findLatestPlayerJoinLog as jest.Mock
    ).mockResolvedValue(null);
    (
      worldJoinLogService.createVRChatWorldJoinLogModel as jest.Mock
    ).mockResolvedValue([]);
    (vrchatPhotoService.getLatestPhotoDate as jest.Mock).mockResolvedValue(
      null,
    );
    (
      vrchatPhotoService.createVRChatPhotoPathIndex as jest.Mock
    ).mockResolvedValue([]);

    // テスト実行
    await loadLogInfoIndexFromVRChatLog();

    // バッチ処理の回数を検証（2500件なので3回のバッチ処理が必要）
    expect(
      worldJoinLogService.createVRChatWorldJoinLogModel,
    ).toHaveBeenCalledTimes(3);

    // 各バッチのサイズを検証
    const calls = (
      worldJoinLogService.createVRChatWorldJoinLogModel as jest.Mock
    ).mock.calls;
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
    };

    const mockLogs = neverthrow.ok([worldJoinLog, playerJoinLog]);

    (
      vrchatLogService.getVRChaLogInfoByLogFilePathList as jest.Mock
    ).mockResolvedValue(mockLogs);
    (worldJoinLogService.findLatestWorldJoinLog as jest.Mock).mockResolvedValue(
      null,
    );
    (
      playerJoinLogService.findLatestPlayerJoinLog as jest.Mock
    ).mockResolvedValue(null);

    const worldJoinDelay = 100;
    const playerJoinDelay = 50;

    (
      worldJoinLogService.createVRChatWorldJoinLogModel as jest.Mock
    ).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, worldJoinDelay));
      return [];
    });

    (
      playerJoinLogService.createVRChatPlayerJoinLogModel as jest.Mock
    ).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, playerJoinDelay));
      return [];
    });

    (vrchatPhotoService.getLatestPhotoDate as jest.Mock).mockResolvedValue(
      null,
    );
    (
      vrchatPhotoService.createVRChatPhotoPathIndex as jest.Mock
    ).mockResolvedValue([]);

    // テスト実行開始時刻を記録
    const startTime = Date.now();
    await loadLogInfoIndexFromVRChatLog();
    const endTime = Date.now();

    // 並列処理の場合、総実行時間は最も遅い処理（worldJoinDelay）とほぼ同じになるはず
    // マージンとして20ms追加
    expect(endTime - startTime).toBeLessThan(worldJoinDelay + 20);
  });
});
