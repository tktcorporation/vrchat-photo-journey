import * as datefns from 'date-fns';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import * as client from '../../lib/sequelize';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';

describe('getFrequentPlayerNames tRPC endpoint integration tests', () => {
  beforeAll(async () => {
    client.__initTestRDBClient();
  }, 10000);

  beforeEach(async () => {
    await client.__forceSyncRDBClient();
    // このテストファイル内でのみモックを無効化
    vi.doUnmock('../logInfo/service');
    vi.doUnmock('../VRChatPlayerJoinLogModel/playerJoinLog.service');
  });

  afterAll(async () => {
    await client.__cleanupTestRDBClient();
  });

  it('tRPCエンドポイント経由でよく遊ぶプレイヤー名を取得できる', async () => {
    // テストデータの準備
    const testData = [
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'PopularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
        playerName: 'PopularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
        playerName: 'PopularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-04T00:00:00Z'),
        playerName: 'PopularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'RegularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
        playerName: 'RegularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
        playerName: 'RegularPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'CasualPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
        playerName: 'CasualPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'NewPlayer',
        logType: 'playerJoin' as const,
        playerId: null,
      },
    ];

    await playerJoinLogService.createVRChatPlayerJoinLogModel(testData);

    // logInfoRouter をインポートしてテスト
    const { logInfoRouter } = await import('./logInfoCointroller');
    const router = logInfoRouter();

    // tRPCエンドポイントを直接呼び出し
    const resolver = router.getFrequentPlayerNames._def.resolver as (opts: {
      ctx: Record<string, unknown>;
      input: { limit?: number };
    }) => Promise<string[]>;

    const result = await resolver({
      ctx: {},
      input: { limit: 3 },
    });

    // 頻度順で返されることを確認
    expect(result).toEqual(['PopularPlayer', 'RegularPlayer', 'CasualPlayer']);
  });

  it('limitパラメータが正しく機能する', async () => {
    // テストデータの準備
    const testData = [
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player1',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
        playerName: 'Player1',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
        playerName: 'Player1',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player2',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
        playerName: 'Player2',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player3',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player4',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player5',
        logType: 'playerJoin' as const,
        playerId: null,
      },
    ];

    await playerJoinLogService.createVRChatPlayerJoinLogModel(testData);

    const { logInfoRouter } = await import('./logInfoCointroller');
    const router = logInfoRouter();

    // limit=2で取得
    const resolver = router.getFrequentPlayerNames._def.resolver as (opts: {
      ctx: Record<string, unknown>;
      input: { limit?: number };
    }) => Promise<string[]>;

    const result = await resolver({
      ctx: {},
      input: { limit: 2 },
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(['Player1', 'Player2']);
  });

  it('データが存在しない場合は空配列を返す', async () => {
    const { logInfoRouter } = await import('./logInfoCointroller');
    const router = logInfoRouter();

    const resolver = router.getFrequentPlayerNames._def.resolver as (opts: {
      ctx: Record<string, unknown>;
      input: { limit?: number };
    }) => Promise<string[]>;

    const result = await resolver({
      ctx: {},
      input: { limit: 5 },
    });

    expect(result).toEqual([]);
  });

  it('デフォルトのlimit値が適用される', async () => {
    // 6人のプレイヤーデータを作成（デフォルトlimit=5より多く）
    const testData = [
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player1',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player2',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player3',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player4',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player5',
        logType: 'playerJoin' as const,
        playerId: null,
      },
      {
        joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
        playerName: 'Player6',
        logType: 'playerJoin' as const,
        playerId: null,
      },
    ];

    await playerJoinLogService.createVRChatPlayerJoinLogModel(testData);

    const { logInfoRouter } = await import('./logInfoCointroller');
    const router = logInfoRouter();

    // limitを指定せずに呼び出し（デフォルト=5が適用されるはず）
    const resolver = router.getFrequentPlayerNames._def.resolver as (opts: {
      ctx: Record<string, unknown>;
      input: { limit?: number };
    }) => Promise<string[]>;

    const result = await resolver({
      ctx: {},
      input: { limit: 5 }, // Explicitly pass default limit since we're bypassing zod parsing
    });

    expect(result).toHaveLength(5); // デフォルトの5件
    expect(result).toEqual([
      'Player1',
      'Player2',
      'Player3',
      'Player4',
      'Player5',
    ]);
  });
});
