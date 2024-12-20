import * as service from './playerJoinLog.service';

import * as datefns from 'date-fns';
import * as client from '../../lib/sequelize';

describe('VRChatPlayerJoinLogModel', () => {
  describe('createVRChatPlayerJoinLogModel', () => {
    beforeAll(async () => {
      client.__initTestRDBClient();
    }, 10000);
    beforeEach(async () => {
      await client.__forceSyncRDBClient();
    });
    afterAll(async () => {
      await client.__cleanupTestRDBClient();
    });
    it('should create playerJoinLog', async () => {
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-02T00:00:00Z'),
          playerName: 'player2',
          logType: 'playerJoin' as const,
        },
      ];
      await service.createVRChatPlayerJoinLogModel(playerJoinLogList);
      const result = await service.getVRChatPlayerJoinLogListByJoinDateTime({
        startJoinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
        endJoinDateTime: datefns.parseISO('2021-01-03T00:00:00Z'),
      });
      expect(
        result.map((log) => ({
          joinDateTime: log.joinDateTime,
          playerName: log.playerName,
        })),
      ).toEqual([
        {
          joinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
        },
        {
          joinDateTime: datefns.parseISO('2021-01-02T00:00:00Z'),
          playerName: 'player2',
        },
      ]);
    });
    it('should handle create duplicated playerJoinLog', async () => {
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player2',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player2',
          logType: 'playerJoin' as const,
        },
      ];
      await service.createVRChatPlayerJoinLogModel(playerJoinLogList);
      const result = await service.getVRChatPlayerJoinLogListByJoinDateTime({
        startJoinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
        endJoinDateTime: datefns.parseISO('2021-01-04T00:00:00Z'),
      });
      expect(
        result.map((log) => ({
          joinDateTime: log.joinDateTime,
          playerName: log.playerName,
        })),
      ).toEqual([
        {
          joinDateTime: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player1',
        },
        {
          joinDateTime: datefns.parseISO('2021-01-03T00:00:00Z'),
          playerName: 'player2',
        },
      ]);
    });
    it('should handle create duplicated playerJoinLog call twice', async () => {
      const playerJoinLogList = [
        {
          joinDate: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
        {
          joinDate: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
          logType: 'playerJoin' as const,
        },
      ];
      const result1 =
        await service.createVRChatPlayerJoinLogModel(playerJoinLogList);
      expect(
        result1.map((log) => ({
          joinDateTime: log.joinDateTime,
          playerName: log.playerName,
        })),
      ).toEqual([
        {
          joinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
        },
      ]);
      const result2 =
        await service.createVRChatPlayerJoinLogModel(playerJoinLogList);
      expect(
        result2.map((log) => ({
          joinDateTime: log.joinDateTime,
          playerName: log.playerName,
        })),
      ).toEqual([]);

      const logs = await service.getVRChatPlayerJoinLogListByJoinDateTime({
        startJoinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
        endJoinDateTime: datefns.parseISO('2021-01-04T00:00:00Z'),
      });
      expect(
        logs.map((log) => ({
          joinDateTime: log.joinDateTime,
          playerName: log.playerName,
        })),
      ).toEqual([
        {
          joinDateTime: datefns.parseISO('2021-01-01T00:00:00Z'),
          playerName: 'player1',
        },
      ]);
    });
  });
});
