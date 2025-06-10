import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
import z from 'zod';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';
import { findVRChatWorldJoinLogFromPhotoList } from '../vrchatWorldJoinLogFromPhoto/service';
import { logger } from './../../lib/logger';
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

/**
 * 統合されたワールド参加ログから指定日時以前の最新ログを取得
 * 通常ログを優先し、PhotoAsLogと統合した結果から検索
 * 指定時刻のログも含めるため、1秒後までの範囲で検索
 */
const findRecentMergedWorldJoinLog = async (datetime: Date) => {
  // 指定時刻から1秒後までのログを取得（指定時刻のログも含める）
  const searchEndTime = new Date(datetime.getTime() + 1000);
  const [normalLogs, photoLogs] = await Promise.all([
    worldJoinLogService.findVRChatWorldJoinLogList({
      ltJoinDateTime: searchEndTime,
      orderByJoinDateTime: 'desc',
    }),
    findVRChatWorldJoinLogFromPhotoList({
      ltJoinDateTime: searchEndTime,
      orderByJoinDateTime: 'desc',
    }),
  ]);

  // 統合してソート
  const mergedLogs = worldJoinLogService.mergeVRChatWorldJoinLogs({
    normalLogs: normalLogs,
    photoLogs: photoLogs,
  });

  // 日時でソートして最新のものを取得
  const sortedLogs = mergedLogs.sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  return sortedLogs[0] ?? null;
};

/**
 * 統合されたワールド参加ログから指定日時以降の次のログを取得
 */
const findNextMergedWorldJoinLog = async (datetime: Date) => {
  // 通常ログとPhotoAsLogを並行取得
  const [normalLogs, photoLogs] = await Promise.all([
    worldJoinLogService.findVRChatWorldJoinLogList({
      gtJoinDateTime: datetime,
      orderByJoinDateTime: 'asc',
    }),
    findVRChatWorldJoinLogFromPhotoList({
      gtJoinDateTime: datetime,
      orderByJoinDateTime: 'asc',
    }),
  ]);

  // 統合してソート
  const mergedLogs = worldJoinLogService.mergeVRChatWorldJoinLogs({
    normalLogs: normalLogs,
    photoLogs: photoLogs,
  });

  // 日時でソートして最初のものを取得
  const sortedLogs = mergedLogs.sort(
    (a, b) => a.joinDateTime.getTime() - b.joinDateTime.getTime(),
  );

  return sortedLogs[0] ?? null;
};

const getRecentVRChatWorldJoinLogByVRChatPhotoName = async (
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
 * 同じセッション内でjoinしたプレイヤー全員のリストを取得
 * 統合されたワールド参加ログ（通常ログ優先）を使用してセッション範囲を特定
 * セッション期間内にjoinしたプレイヤー全員を返す（途中でleaveしたプレイヤーも含む）
 * @param datetime 参加日時
 * @returns プレイヤーリスト（セッション期間内にjoinした全プレイヤー）
 */
export const getPlayerJoinListInSameWorld = async (
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
  // 統合されたログから直前のワールド参加ログを取得（通常ログ優先）
  const recentWorldJoin = await findRecentMergedWorldJoinLog(datetime);
  if (recentWorldJoin === null) {
    return neverthrow.err('RECENT_JOIN_LOG_NOT_FOUND' as const);
  }

  // 統合されたログから次のワールド参加ログを取得
  const nextWorldJoin = await findNextMergedWorldJoinLog(
    recentWorldJoin.joinDateTime,
  );

  const playerJoinLogResult =
    await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
      startJoinDateTime: recentWorldJoin.joinDateTime,
      endJoinDateTime: nextWorldJoin?.joinDateTime ?? null,
    });

  if (playerJoinLogResult.isErr()) {
    // エラータイプに基づいて適切な処理を行う
    const error = playerJoinLogResult.error;
    logger.error({
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
        logger.info('loadLogInfoIndex');
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
        logger.info('getRecentVRChatWorldJoinLogByVRChatPhotoName', ctx.input);
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
      const playerJoinLogListResult = await getPlayerJoinListInSameWorld(
        ctx.input,
      );
      if (playerJoinLogListResult.isErr()) {
        return match(playerJoinLogListResult.error)
          .with('RECENT_JOIN_LOG_NOT_FOUND', () => {
            logger.debug('getPlayerListInSameWorld: RECENT_JOIN_LOG_NOT_FOUND');
            return [];
          })
          .exhaustive();
      }
      return playerJoinLogListResult.value;
    }),
  });
