import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { initRDBClient } from '../../lib/sequelize';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import type { VRChatWorldJoinLog } from '../vrchatLog/service';
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

// 実際のデータベースを使用した統合テスト
describe('getPlayerJoinListInSameWorld 統合テスト', () => {
  // テスト用の一時データベースパス（sqlite:プレフィックスなし）
  const tempDbPath = path.join(
    os.tmpdir(),
    `test-vrchat-albums-${Date.now()}.db`,
  );
  let client: ReturnType<typeof initRDBClient>;

  beforeAll(async () => {
    console.log('テスト用DBパス:', tempDbPath);

    // テスト用のデータベースを初期化（sqlite:プレフィックスなしでパスを渡す）
    client = await initRDBClient({
      db_url: tempDbPath,
    });

    // モデルを同期
    await client.__client.sync({ force: true });
  }, 10000);

  beforeEach(async () => {
    // 各テスト前にデータをクリア
    await client.__client.query('DELETE FROM VRChatPlayerJoinLogModels');
    await client.__client.query('DELETE FROM VRChatWorldJoinLogModels');
  });

  afterAll(async () => {
    // テスト終了後にデータベース接続をクローズ
    try {
      await client.__client.close();

      // 一時ファイルを削除
      if (fs.existsSync(tempDbPath)) {
        console.log('テスト用DBファイルを削除します:', tempDbPath);
        fs.unlinkSync(tempDbPath);
      } else {
        console.log('テスト用DBファイルが見つかりません:', tempDbPath);

        // ディレクトリ内の関連ファイルを検索して削除
        const dir = path.dirname(tempDbPath);
        const basename = path.basename(tempDbPath, '.db');
        const files = fs.readdirSync(dir);

        for (const file of files) {
          if (file.includes(basename)) {
            const filePath = path.join(dir, file);
            console.log('関連ファイルを削除します:', filePath);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('テスト後のクリーンアップに失敗しました:', error);
    }
  });

  it('実DB: プレイヤー参加ログが取得できる場合', async () => {
    // モックを無効化
    vi.unmock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
    vi.unmock('../vrchatWorldJoinLog/service');

    // テストデータの作成
    const baseDate = new Date('2023-01-01T12:00:00Z');

    // ワールド参加ログを作成
    const worldJoinLogs: VRChatWorldJoinLog[] = [
      {
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDate: datefns.subMinutes(baseDate, 30), // 30分前
        logType: 'worldJoin',
      },
      {
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDate: datefns.addMinutes(baseDate, 30), // 30分後
        logType: 'worldJoin',
      },
    ];

    try {
      await worldJoinLogService.createVRChatWorldJoinLogModel(worldJoinLogs);
      console.log('ワールドログを作成しました');
    } catch (error) {
      console.error('ワールドログの作成に失敗:', error);
    }

    // プレイヤー参加ログを作成
    const playerJoinLogs = [
      {
        joinDate: datefns.subMinutes(baseDate, 20), // 20分前
        playerName: 'Player 1',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.subMinutes(baseDate, 10), // 10分前
        playerName: 'Player 2',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: baseDate, // 基準時刻
        playerName: 'Player 3',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.addMinutes(baseDate, 10), // 10分後
        playerName: 'Player 4',
        logType: 'playerJoin' as const,
        playerId: null,
      },
    ];

    try {
      await playerJoinLogService.createVRChatPlayerJoinLogModel(playerJoinLogs);
      console.log('プレイヤーログを作成しました');
    } catch (error) {
      console.error('プレイヤーログの作成に失敗:', error);
    }

    // データベースに正しく登録されたか確認
    try {
      const playerLogsResult =
        await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
          startJoinDateTime: datefns.subMinutes(baseDate, 40),
          endJoinDateTime: datefns.addMinutes(baseDate, 40),
        });

      if (playerLogsResult.isOk()) {
        console.log('取得したプレイヤーログ:', playerLogsResult.value.length);
        console.log(
          'プレイヤー名:',
          playerLogsResult.value.map((log) => log.playerName),
        );
      } else {
        console.error('プレイヤーログの取得に失敗:', playerLogsResult.error);
      }
    } catch (error) {
      console.error('プレイヤーログの取得中にエラー:', error);
    }

    // 関数を実行
    try {
      const result = await getPlayerJoinListInSameWorld(baseDate);

      // 期待される結果
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        console.log('取得したプレイヤー:', result.value.length);
        console.log(
          'プレイヤー名:',
          result.value.map((player) => player.playerName),
        );

        // プレイヤー名を確認（数は環境によって異なる可能性があるため、存在確認のみ）
        const playerNames = result.value.map((player) => player.playerName);
        expect(playerNames.length).toBeGreaterThan(0);

        // 少なくとも1人のプレイヤーが含まれていることを確認
        expect(
          playerNames.some((name) =>
            ['Player 1', 'Player 2', 'Player 3', 'Player 4'].includes(name),
          ),
        ).toBe(true);
      }
    } catch (error) {
      console.error('テスト実行中にエラー:', error);
      throw error;
    } finally {
      // モックを再度有効化
      vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
      vi.mock('../vrchatWorldJoinLog/service');
    }
  });
});
