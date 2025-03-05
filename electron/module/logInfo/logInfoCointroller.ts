import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
import z from 'zod';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import * as log from './../../lib/logger';
import { procedure, router as trpcRouter } from './../../trpc';
import {
  type VRChatPhotoFileNameWithExt,
  VRChatPhotoFileNameWithExtSchema,
} from './../../valueObjects';
import { loadLogInfoIndexFromVRChatLog } from './service';

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

/**
 * 同じワールドにいたプレイヤーのリストを取得
 * @param datetime 参加日時
 * @returns プレイヤーリスト
 */
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
  // 指定された日時の前後30分のログを取得
  const startDateTime = datefns.subMinutes(datetime, 30);
  const endDateTime = datefns.addMinutes(datetime, 30);

  const playerJoinLogResult =
    await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
      startJoinDateTime: startDateTime,
      endJoinDateTime: endDateTime,
    });

  if (playerJoinLogResult.isErr()) {
    // エラータイプに基づいて適切な処理を行う
    const error = playerJoinLogResult.error;
    log.error({
      message: `プレイヤー参加ログの取得に失敗しました: ${error.message}`,
      stack: new Error(`プレイヤー参加ログエラー: ${error.type}`),
    });

    switch (error.type) {
      case 'DATABASE_ERROR':
      case 'INVALID_DATE_RANGE':
      case 'NOT_FOUND':
        return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND');
      default:
        // 型安全のためのケース（実際には到達しない）
        throw new Error(`未知のエラータイプ: ${JSON.stringify(error)}`);
    }
  }

  const playerJoinLogList = playerJoinLogResult.value;
  if (playerJoinLogList.length === 0) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND');
  }

  return neverthrow.ok(playerJoinLogList);
};

export const logInfoRouter = () =>
  trpcRouter({
    loadLogInfoIndex: procedure
      .input(
        z.object({
          excludeOldLogLoad: z.boolean(),
        }),
      )
      .mutation(async (ctx) => {
        log.info('loadLogInfoIndex');
        const result = await loadLogInfoIndexFromVRChatLog({
          excludeOldLogLoad: ctx.input.excludeOldLogLoad,
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
     * @param datetime - 参加日時
     * @returns プレイヤーリスト
     */
    getPlayerListInSameWorld: procedure.input(z.date()).query(async (ctx) => {
      log.info(
        'getPlayerListInSameWorld: 同じワールドのプレイヤーリストを取得します',
      );
      const playerJoinLogListResult = await getPlayerJoinListInSameWorld(
        ctx.input,
      );
      if (playerJoinLogListResult.isErr()) {
        log.error({
          message: 'プレイヤーリスト取得エラー',
          stack: new Error(playerJoinLogListResult.error),
        });
        return {
          errorMessage: playerJoinLogListResult.error,
        };
      }
      return playerJoinLogListResult.value;
    }),
  });
