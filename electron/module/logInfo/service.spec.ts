import * as datefns from 'date-fns';
import * as client from '../../lib/sequelize';
import * as service from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import { getFrequentPlayerNames } from './service';

describe('logInfo service', () => {
  describe('getFrequentPlayerNames', () => {
    beforeAll(async () => {
      client.__initTestRDBClient();
    }, 10000);

    beforeEach(async () => {
      await client.__forceSyncRDBClient();
    });

    afterAll(async () => {
      await client.__cleanupTestRDBClient();
    });

    it('プレイヤー参加ログから頻度順に上位プレイヤー名を取得する', async () => {
      // テストデータの準備 - Player1が最も頻度が高い
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player3',
          logType: 'playerJoin' as const,
          playerId: 'id3',
        },
      ];

      await service.createVRChatPlayerJoinLogModel(playerJoinLogList);

      const result = await getFrequentPlayerNames(3);

      // 頻度順（Player1: 3回, Player2: 2回, Player3: 1回）で返されることを確認
      expect(result).toEqual(['Player1', 'Player2', 'Player3']);
    });

    it('limitパラメータが機能することを確認', async () => {
      // 5人のプレイヤーデータを作成
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-04T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-05T00:00:00Z'),
          playerName: 'Player1',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
        {
          joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
        {
          joinDate: datefns.parseISO('2024-01-04T00:00:00Z'),
          playerName: 'Player2',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player3',
          logType: 'playerJoin' as const,
          playerId: 'id3',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player3',
          logType: 'playerJoin' as const,
          playerId: 'id3',
        },
        {
          joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
          playerName: 'Player3',
          logType: 'playerJoin' as const,
          playerId: 'id3',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player4',
          logType: 'playerJoin' as const,
          playerId: 'id4',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'Player4',
          logType: 'playerJoin' as const,
          playerId: 'id4',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'Player5',
          logType: 'playerJoin' as const,
          playerId: 'id5',
        },
      ];

      await service.createVRChatPlayerJoinLogModel(playerJoinLogList);

      // 上位2名のみ取得
      const result = await getFrequentPlayerNames(2);

      expect(result).toHaveLength(2);
      expect(result).toEqual(['Player1', 'Player2']);
    });

    it('プレイヤーログが存在しない場合は空配列を返す', async () => {
      const result = await getFrequentPlayerNames(5);

      expect(result).toEqual([]);
    });

    it('同じ頻度のプレイヤーがいる場合でも正しく処理される', async () => {
      // 同じ頻度のプレイヤーデータを作成
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'PlayerA',
          logType: 'playerJoin' as const,
          playerId: 'idA',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'PlayerA',
          logType: 'playerJoin' as const,
          playerId: 'idA',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'PlayerB',
          logType: 'playerJoin' as const,
          playerId: 'idB',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'PlayerB',
          logType: 'playerJoin' as const,
          playerId: 'idB',
        },

        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'PlayerC',
          logType: 'playerJoin' as const,
          playerId: 'idC',
        },
      ];

      await service.createVRChatPlayerJoinLogModel(playerJoinLogList);

      const result = await getFrequentPlayerNames(3);

      expect(result).toHaveLength(3);
      expect(result).toContain('PlayerA');
      expect(result).toContain('PlayerB');
      expect(result).toContain('PlayerC');
      // PlayerAとPlayerBは同じ頻度なので順序は不定だが、両方含まれている
      expect(result.slice(0, 2)).toEqual(
        expect.arrayContaining(['PlayerA', 'PlayerB']),
      );
      expect(result[2]).toBe('PlayerC');
    });

    it('重複したプレイヤー名でも正しく集計される', async () => {
      // 異なる時刻での複数参加をテスト
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'FrequentPlayer',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-02T00:00:00Z'),
          playerName: 'FrequentPlayer',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-03T00:00:00Z'),
          playerName: 'FrequentPlayer',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'SinglePlayer',
          logType: 'playerJoin' as const,
          playerId: 'id2',
        },
      ];

      const createdEntries =
        await service.createVRChatPlayerJoinLogModel(playerJoinLogList);
      expect(createdEntries).toHaveLength(4); // 全て異なる時刻なので4つ作成される

      const result = await getFrequentPlayerNames(2);

      // FrequentPlayerは3回、SinglePlayerは1回なので、この順序で返される
      expect(result).toEqual(['FrequentPlayer', 'SinglePlayer']);
    });
  });
});
