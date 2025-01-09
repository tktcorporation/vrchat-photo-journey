import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
import z from 'zod';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import * as log from './../../lib/logger';
import { procedure, router as trpcRouter } from './../../trpc';
import { loadLogInfoIndexFromVRChatLog } from './service';
import {
  type VRChatPhotoFileNameWithExt,
  VRChatPhotoFileNameWithExtSchema,
} from './valueObjects';

const getVRCWorldJoinLogList = async () => {
  const joinLogList = await worldJoinLogService.findAllVRChatWorldJoinLogList();
  return joinLogList.map((joinLog) => {
    return {
      id: joinLog.id as string,
      worldId: joinLog.worldId,
      worldName: joinLog.worldName,
      worldInstanceId: joinLog.worldInstanceId,
      joinDateTime: joinLog.joinDateTime,
      createdAt: joinLog.createdAt as Date,
      updatedAt: joinLog.updatedAt as Date,
    };
  });
};

export const getRecentVRChatWorldJoinLogByVRChatPhotoName = async (
  vrchatPhotoName: VRChatPhotoFileNameWithExt,
): Promise<
  neverthrow.Result<
    {
      id: string;
      worldId: string;
      worldName: string;
      worldInstanceId: string;
      joinDateTime: Date;
      createdAt: Date;
      updatedAt: Date;
      nextJoinLog: {
        id: string;
        worldId: string;
        worldName: string;
        worldInstanceId: string;
        joinDateTime: Date;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    },
    'RECENT_JOIN_LOG_NOT_FOUND'
  >
> => {
  const joinLog = await worldJoinLogService.findRecentVRChatWorldJoinLog(
    vrchatPhotoName.photoTakenDateTime,
  );
  if (joinLog === null) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND' as const);
  }

  const nextJoinLog = await worldJoinLogService.findNextVRChatWorldJoinLog(
    joinLog.joinDateTime,
  );

  return neverthrow.ok({
    id: joinLog.id as string,
    worldId: joinLog.worldId,
    worldName: joinLog.worldName,
    worldInstanceId: joinLog.worldInstanceId,
    joinDateTime: joinLog.joinDateTime,
    createdAt: joinLog.createdAt as Date,
    updatedAt: joinLog.updatedAt as Date,
    nextJoinLog: match(nextJoinLog)
      .with(P.nullish, () => null)
      .with(P.nonNullable, (value) => {
        return {
          id: value.id as string,
          worldId: value.worldId,
          worldName: value.worldName,
          worldInstanceId: value.worldInstanceId,
          joinDateTime: value.joinDateTime,
          createdAt: value.createdAt as Date,
          updatedAt: value.updatedAt as Date,
        };
      })
      .exhaustive(),
  });
};

const getPlayerJoinListInSameWorld = async (
  datetime: Date,
): Promise<
  neverthrow.Result<
    {
      id: string;
      playerId: string | null;
      playerName: string;
      joinDateTime: Date;
      createdAt: Date;
      updatedAt: Date;
    }[],
    'RECENT_JOIN_LOG_NOT_FOUND'
  >
> => {
  const recentWorldJoin =
    await worldJoinLogService.findRecentVRChatWorldJoinLog(datetime);
  if (recentWorldJoin === null) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND' as const);
  }

  const nextWorldJoin =
    await worldJoinLogService.findNextVRChatWorldJoinLog(datetime);

  const playerJoinLogList =
    await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
      startJoinDateTime: recentWorldJoin.joinDateTime,
      endJoinDateTime: nextWorldJoin?.joinDateTime ?? null,
    });

  return neverthrow.ok(
    playerJoinLogList.map((playerJoinLog) => {
      return {
        id: playerJoinLog.id as string,
        playerId: playerJoinLog.playerId,
        playerName: playerJoinLog.playerName,
        joinDateTime: playerJoinLog.joinDateTime,
        createdAt: playerJoinLog.createdAt as Date,
        updatedAt: playerJoinLog.updatedAt as Date,
      };
    }),
  );
};

export const logInfoRouter = () =>
  trpcRouter({
    loadLogInfoIndex: procedure.mutation(async () => {
      log.info('loadLogInfoIndex');
      const result = await loadLogInfoIndexFromVRChatLog({
        excludeOldLogLoad: true,
      });
      if (result.isErr()) {
        return neverthrow.err(result.error);
      }
    }),
    getVRCWorldJoinLogList: procedure.query(async () => {
      const joinLogList = await getVRCWorldJoinLogList();
      return joinLogList;
    }),
    getRecentVRChatWorldJoinLogByVRChatPhotoName: procedure
      .input(VRChatPhotoFileNameWithExtSchema)
      .query(async (ctx) => {
        log.info('getRecentVRChatWorldJoinLogByVRChatPhotoName', ctx.input);
        const joinLogResult =
          await getRecentVRChatWorldJoinLogByVRChatPhotoName(ctx.input);
        return joinLogResult.match(
          (value) => {
            return value;
          },
          (error) => {
            throw error;
          },
        );
      }),
    /**
     * 同じワールドにいたプレイヤーのリストを取得
     * @param joinDateTime - 参加日時
     * @returns プレイヤーリスト
     */
    getPlayerListInSameWorld: procedure.input(z.date()).query(async (ctx) => {
      const playerJoinLogListResult = await getPlayerJoinListInSameWorld(
        ctx.input,
      );
      if (playerJoinLogListResult.isErr()) {
        return {
          errorMessage: playerJoinLogListResult.error,
        };
      }
      return playerJoinLogListResult.value;
    }),
  });
