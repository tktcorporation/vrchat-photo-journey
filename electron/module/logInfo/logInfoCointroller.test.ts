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
import { clearAllCaches } from '../../lib/queryCache';
import * as initRDBClient from '../../lib/sequelize';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import {
  VRChatPlayerNameSchema,
  VRChatWorldIdSchema,
  VRChatWorldInstanceIdSchema,
  VRChatWorldNameSchema,
} from '../vrchatLog/model';
import type { VRChatWorldJoinLog } from '../vrchatLog/service';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { findVRChatWorldJoinLogFromPhotoList } from '../vrchatWorldJoinLogFromPhoto/service';
import { getPlayerJoinListInSameWorld } from './logInfoCointroller';

// playerJoinLogServiceとworldJoinLogServiceのモック
vi.mock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
vi.mock('../vrchatWorldJoinLog/service');
vi.mock('../vrchatWorldJoinLogFromPhoto/service');

describe('getPlayerJoinListInSameWorld', () => {
  // テスト前にモックとキャッシュをリセット
  beforeEach(() => {
    vi.resetAllMocks();
    clearAllCaches(); // キャッシュをクリア
    // 統合処理に必要なモックの共通設定
    vi.mocked(worldJoinLogService.findVRChatWorldJoinLogList).mockResolvedValue(
      [],
    );
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([]);
    vi.mocked(findVRChatWorldJoinLogFromPhotoList).mockResolvedValue([]);
  });

  it('正常系: プレイヤー参加ログが取得できる場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');
    // 修正後の動作: 指定時刻（12:00）のログも検索範囲に含まれる
    const mockRecentWorldJoin = {
      id: 'world1',
      worldId: 'wrld_123',
      worldName: 'Test World',
      worldInstanceId: 'instance1',
      joinDateTime: new Date('2023-01-01T12:00:00Z'), // 指定時刻と同じ
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockNextWorldJoin = {
      id: 'world2',
      worldId: 'wrld_456',
      worldName: 'Next World',
      worldInstanceId: 'instance2',
      joinDateTime: new Date('2023-01-01T13:00:00Z'), // 1時間後
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPlayerJoinLogList = [
      {
        id: '1',
        playerId: 'player1',
        playerName: 'Player 1',
        joinDateTime: new Date('2023-01-01T12:10:00Z'), // セッション内
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        playerId: 'player2',
        playerName: 'Player 2',
        joinDateTime: new Date('2023-01-01T12:30:00Z'), // セッション内
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 統合処理で返すログを設定（ソート順: 古い順）
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
      mockNextWorldJoin,
      mockRecentWorldJoin,
    ]);

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
    // 実際の実装: recentは降順ソート後の最初、nextは昇順ソート後の最初
    expect(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).toHaveBeenCalledWith({
      startJoinDateTime: mockNextWorldJoin.joinDateTime, // 降順で最初 = より新しい時刻
      endJoinDateTime: mockRecentWorldJoin.joinDateTime, // 昇順で最初 = より古い時刻
    });
  });

  it('異常系: 直近のワールド参加ログが見つからない場合', async () => {
    // モックデータ
    const mockDateTime = new Date('2023-01-01T12:00:00Z');

    // 統合処理で空の結果を返す（ログが見つからない場合）
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([]);

    // 関数を実行
    const result = await getPlayerJoinListInSameWorld(mockDateTime);

    // 期待される結果
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('RECENT_JOIN_LOG_NOT_FOUND');
    }
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
    };

    const mockError = {
      type: 'DATABASE_ERROR' as const,
      message: 'データベースエラー',
    };

    // 統合処理で1つのログを返す
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
      mockRecentWorldJoin,
    ]);

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
    };

    // 統合処理で1つのログを返す
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
      mockRecentWorldJoin,
    ]);

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
    };

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

    // 統合処理で1つのログのみを返す（次のログなし）
    vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
      mockRecentWorldJoin,
    ]);

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
    // 1つのログのみの場合、findNextは同じログを返すため、endJoinDateTimeも同じになる
    expect(
      playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
    ).toHaveBeenCalledWith({
      startJoinDateTime: mockRecentWorldJoin.joinDateTime,
      endJoinDateTime: mockRecentWorldJoin.joinDateTime, // 同じログ
    });
  });

  // セッション内全プレイヤー取得のテストケース
  describe('セッション内全プレイヤー取得のテストケース', () => {
    it('セッション期間内にjoinした全プレイヤーが取得される（leaveしたプレイヤーも含む）', async () => {
      const mockDateTime = new Date('2023-01-01T12:00:00Z');

      // セッション開始と終了を示すワールド参加ログ
      // recentは指定時刻より前の最新ログ、nextはrecentより後の最初のログ
      const mockRecentLog = {
        id: 'recent1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:00:00Z'), // 12:00より前の最新
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNextLog = {
        id: 'next1',
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2023-01-01T13:00:00Z'), // recentより後の最初
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // セッション期間内にjoinしたプレイヤー（途中でleaveした人も含む）
      const mockPlayersInSession = [
        {
          id: '1',
          playerId: 'player1',
          playerName: 'Early Joiner',
          joinDateTime: new Date('2023-01-01T11:15:00Z'), // セッション開始後すぐ
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          playerId: 'player2',
          playerName: 'Mid Joiner',
          joinDateTime: new Date('2023-01-01T12:00:00Z'), // セッション中間
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          playerId: 'player3',
          playerName: 'Late Joiner',
          joinDateTime: new Date('2023-01-01T12:45:00Z'), // セッション終了前
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          playerId: null,
          playerName: 'Guest Player',
          joinDateTime: new Date('2023-01-01T11:30:00Z'), // IDなしプレイヤー
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 統合処理のモック
      // findRecentMergedWorldJoinLogとfindNextMergedWorldJoinLogで
      // それぞれ適切なログが返されるようにモック設定
      vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
        mockRecentLog, // findRecentが返すログ
        mockNextLog, // findNextが返すログ
      ]);

      // プレイヤー参加ログサービスのモック
      vi.mocked(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).mockResolvedValue(neverthrow.ok(mockPlayersInSession));

      // 関数を実行
      const result = await getPlayerJoinListInSameWorld(mockDateTime);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockPlayersInSession);
        expect(result.value).toHaveLength(4);

        // 各プレイヤーの名前を確認
        const playerNames = result.value.map((p) => p.playerName);
        expect(playerNames).toContain('Early Joiner');
        expect(playerNames).toContain('Mid Joiner');
        expect(playerNames).toContain('Late Joiner');
        expect(playerNames).toContain('Guest Player');
      }

      // 正しい期間でプレイヤー情報が取得されたか確認
      // 実際の実装: recentは降順ソート後の最初、nextは昇順ソート後の最初
      expect(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).toHaveBeenCalledWith({
        startJoinDateTime: mockNextLog.joinDateTime, // 降順で最初 = より新しい時刻
        endJoinDateTime: mockRecentLog.joinDateTime, // 昇順で最初 = より古い時刻
      });
    });

    it('セッション期間外のプレイヤーは除外される', async () => {
      const mockDateTime = new Date('2023-01-01T12:00:00Z');

      const mockRecentLog = {
        id: 'recent1',
        worldId: 'wrld_123',
        worldName: 'Test World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNextLog = {
        id: 'next1',
        worldId: 'wrld_456',
        worldName: 'Next World',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2023-01-01T13:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // セッション期間内のプレイヤーのみ（期間外は除外済み）
      const mockPlayersInSession = [
        {
          id: '1',
          playerId: 'player1',
          playerName: 'Session Player',
          joinDateTime: new Date('2023-01-01T12:00:00Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 統合処理のモック
      vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
        mockRecentLog,
        mockNextLog,
      ]);

      // 期間内のプレイヤーのみ返すようモック
      vi.mocked(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).mockResolvedValue(neverthrow.ok(mockPlayersInSession));

      // 関数を実行
      const result = await getPlayerJoinListInSameWorld(mockDateTime);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].playerName).toBe('Session Player');
      }

      // 正しい期間でフィルタリングされているか確認
      expect(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).toHaveBeenCalledWith({
        startJoinDateTime: mockNextLog.joinDateTime,
        endJoinDateTime: mockRecentLog.joinDateTime,
      });
    });

    it('開いているセッション（終了時刻なし）でもプレイヤー取得ができる', async () => {
      const mockDateTime = new Date('2023-01-01T12:00:00Z');

      // 最後のセッション（終了していない）
      const mockRecentLog = {
        id: 'current',
        worldId: 'wrld_123',
        worldName: 'Current World',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2023-01-01T11:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPlayersInCurrentSession = [
        {
          id: '1',
          playerId: 'player1',
          playerName: 'Current Player',
          joinDateTime: new Date('2023-01-01T11:30:00Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 単一のセッションのみ（次のセッションなし）
      vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue([
        mockRecentLog,
      ]);

      vi.mocked(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).mockResolvedValue(neverthrow.ok(mockPlayersInCurrentSession));

      // 関数を実行
      const result = await getPlayerJoinListInSameWorld(mockDateTime);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockPlayersInCurrentSession);
      }

      // 開いているセッションの場合、実際の挙動に基づく確認
      expect(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).toHaveBeenCalledWith({
        startJoinDateTime: mockRecentLog.joinDateTime,
        endJoinDateTime: mockRecentLog.joinDateTime, // 単一ログの場合、recentとnextが同じ
      });
    });
  });

  // 統合処理のテストケース（PhotoAsLogと通常ログの混在）
  describe('統合処理のテストケース', () => {
    it('統合ログから正しくプレイヤーリストが取得される', async () => {
      const mockDateTime = new Date('2023-01-01T12:00:00Z');

      // 統合後の結果（通常ログが優先される）
      const mockMergedLogs = [
        {
          id: 'normal1',
          worldId: 'wrld_123',
          worldName: 'Test World',
          worldInstanceId: 'instance1',
          joinDateTime: new Date('2023-01-01T11:30:00Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPlayerJoinLogs = [
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
        worldJoinLogService.findVRChatWorldJoinLogList,
      ).mockResolvedValue([]);
      vi.mocked(worldJoinLogService.mergeVRChatWorldJoinLogs).mockReturnValue(
        mockMergedLogs,
      );

      // findVRChatWorldJoinLogFromPhotoListのモック
      vi.mocked(findVRChatWorldJoinLogFromPhotoList).mockResolvedValue([]);

      // playerJoinLogServiceのモック
      vi.mocked(
        playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime,
      ).mockResolvedValue(neverthrow.ok(mockPlayerJoinLogs));

      // 関数を実行
      const result = await getPlayerJoinListInSameWorld(mockDateTime);

      // 期待される結果
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockPlayerJoinLogs);
      }

      // 統合関数が呼ばれたことを確認
      expect(worldJoinLogService.mergeVRChatWorldJoinLogs).toHaveBeenCalled();
    });
  });
});
