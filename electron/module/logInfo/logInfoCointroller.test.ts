import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatWorldJoinLogModel } from '../vrchatWorldJoinLog/VRChatWorldJoinLogModel/s_model';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { getPlayerJoinListInSameWorld } from './logInfoCointroller';

// playerJoinLogServiceとworldJoinLogServiceのモック
vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
vi.mock('../vrchatWorldJoinLog/service');

describe('getPlayerJoinListInSameWorld', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('正常系: プレイヤー参加ログが取得できる場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');
    const mockRecentWorldJoin = {
      id: 'world1',
      worldId: 'wrld_123',
      worldName: 'Test World',
      worldInstanceId: 'instance1',
      joinDateTime: new Date('2023-01-01T11:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockNextWorldJoin = {
      id: 'world2',
      worldId: 'wrld_456',
      worldName: 'Next World',
      worldInstanceId: 'instance2',
      joinDateTime: new Date('2023-01-01T12:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world2',
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2023-01-01T12:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockPlayerJoinLogList = [
      {
        id: '1',
        playerId: 'player1',
        playerName: 'Player 1',
        joinDateTime: new Date('2023-01-01T11:45:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        playerId: 'player2',
        playerName: 'Player 2',
        joinDateTime: new Date('2023-01-01T12:15:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // worldJoinLogServiceのモック
    vi.mocked(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).mockResolvedValue(mockRecentWorldJoin);
    vi.mocked(worldJoinLogService.findNextVRChatWorldJoinLog).mockResolvedValue(
      mockNextWorldJoin,
    );

    // playerJoinLogServiceのモック
    vi.mocked(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).mockResolvedValue(neverthrow.ok(mockPlayerJoinLogList));

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockPlayerJoinLogList);
    }

    // findRecentVRChatWorldJoinLogが正しく呼ばれたか確認
    expect(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).toHaveBeenCalledWith(mockDateTime);

    // findNextVRChatWorldJoinLogが正しく呼ばれたか確認
    expect(worldJoinLogService.findNextVRChatWorldJoinLog).toHaveBeenCalledWith(
      mockRecentWorldJoin.joinDateTime,
    );

    // getVRChatPlayerJoinLogListByJoinDateTimeが正しく呼ばれたか確認
    expect(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).toHaveBeenCalledWith({
      startJoinDateTime: mockRecentWorldJoin.joinDateTime,
      endJoinDateTime: mockNextWorldJoin.joinDateTime,
    });
  });

  it('異常系: 直近のワールド参加ログが見つからない場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');

    // worldJoinLogServiceのモック
    vi.mocked(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).mockResolvedValue(null);

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('RECENT_JOIN_LOG_NOT_FOUND');
    }

    // findRecentVRChatWorldJoinLogが正しく呼ばれたか確認
    expect(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).toHaveBeenCalledWith(mockDateTime);

    // 他のサービスが呼ばれていないことを確認
    expect(
      worldJoinLogService.findNextVRChatWorldJoinLog,
    ).not.toHaveBeenCalled();
    expect(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).not.toHaveBeenCalled();
  });

  it('異常系: プレイヤー参加ログの取得に失敗した場合 (DATABASE_ERROR)', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');
    const mockRecentWorldJoin = {
      id: 'world1',
      worldId: 'wrld_123',
      worldName: 'Test World',
      worldInstanceId: 'instance1',
      joinDateTime: new Date('2023-01-01T11:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockNextWorldJoin = {
      id: 'world2',
      worldId: 'wrld_456',
      worldName: 'Next World',
      worldInstanceId: 'instance2',
      joinDateTime: new Date('2023-01-01T12:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world2',
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2023-01-01T12:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockError = {
      type: 'DATABASE_ERROR' as const,
      message: 'データベースエラー',
    };

    // worldJoinLogServiceのモック
    vi.mocked(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).mockResolvedValue(mockRecentWorldJoin);
    vi.mocked(worldJoinLogService.findNextVRChatWorldJoinLog).mockResolvedValue(
      mockNextWorldJoin,
    );

    // playerJoinLogServiceのモック
    vi.mocked(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).mockResolvedValue(neverthrow.err(mockError));

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('RECENT_JOIN_LOG_NOT_FOUND');
    }
  });

  it('異常系: プレイヤー参加ログが空の場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');
    const mockRecentWorldJoin = {
      id: 'world1',
      worldId: 'wrld_123',
      worldName: 'Test World',
      worldInstanceId: 'instance1',
      joinDateTime: new Date('2023-01-01T11:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockNextWorldJoin = {
      id: 'world2',
      worldId: 'wrld_456',
      worldName: 'Next World',
      worldInstanceId: 'instance2',
      joinDateTime: new Date('2023-01-01T12:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world2',
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2023-01-01T12:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    // worldJoinLogServiceのモック
    vi.mocked(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).mockResolvedValue(mockRecentWorldJoin);
    vi.mocked(worldJoinLogService.findNextVRChatWorldJoinLog).mockResolvedValue(
      mockNextWorldJoin,
    );

    // playerJoinLogServiceのモック
    vi.mocked(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).mockResolvedValue(neverthrow.ok([]));

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('RECENT_JOIN_LOG_NOT_FOUND');
    }
  });

  it('異常系: 次のワールド参加ログが存在しない場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');
    const mockRecentWorldJoin = {
      id: 'world1',
      worldId: 'wrld_123',
      worldName: 'Test World',
      worldInstanceId: 'instance1',
      joinDateTime: new Date('2023-01-01T11:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: () => ({
        id: 'world1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as VRChatWorldJoinLogModel;

    const mockPlayerJoinLogList = [
      {
        id: '1',
        playerId: 'player1',
        playerName: 'Player 1',
        joinDateTime: new Date('2023-01-01T11:45:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // worldJoinLogServiceのモック
    vi.mocked(
      worldJoinLogService.findRecentVRChatWorldJoinLog,
    ).mockResolvedValue(mockRecentWorldJoin);
    vi.mocked(worldJoinLogService.findNextVRChatWorldJoinLog).mockResolvedValue(
      null,
    );

    // playerJoinLogServiceのモック
    vi.mocked(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).mockResolvedValue(neverthrow.ok(mockPlayerJoinLogList));

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockPlayerJoinLogList);
    }

    // getVRChatPlayerJoinLogListByJoinDateTimeが正しく呼ばれたか確認
    expect(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).toHaveBeenCalledWith({
      startJoinDateTime: mockRecentWorldJoin.joinDateTime,
      endJoinDateTime: null,
    });
  });
});
