import { z } from 'zod';
import { procedure, router as trpcRouter } from '../../trpc';
import { findVRChatWorldJoinLogFromPhotoList } from '../vrchatWorldJoinLogFromPhoto/service';
import { findVRChatWorldJoinLogList } from './service';

type Context = {
  input: {
    gtJoinDateTime?: Date;
    ltJoinDateTime?: Date;
    orderByJoinDateTime: 'asc' | 'desc';
  };
};

export const vrchatWorldJoinLogRouter = () =>
  trpcRouter({
    /**
     * 自身がVRChatのワールドに参加したログを取得します
     * @param gtJoinDateTime - 参加日時の下限
     * @param ltJoinDateTime - 参加日時の上限
     * @param orderByJoinDateTime - 参加日時のソート順
     * @returns 参加したユーザーのログ
     */
    getVRChatWorldJoinLogList: procedure
      .input(
        z.object({
          gtJoinDateTime: z.date().optional(),
          ltJoinDateTime: z.date().optional(),
          orderByJoinDateTime: z.enum(['asc', 'desc']),
        }),
      )
      .query(
        async (
          ctx: Context,
        ): Promise<
          {
            id: string;
            worldId: string;
            worldName: string;
            worldInstanceId: string;
            joinDateTime: Date;
            createdAt: Date;
            updatedAt: Date | null;
          }[]
        > => {
          const [normalLogs, photoLogs] = await Promise.all([
            findVRChatWorldJoinLogList({
              gtJoinDateTime: ctx.input.gtJoinDateTime,
              ltJoinDateTime: ctx.input.ltJoinDateTime,
              orderByJoinDateTime: ctx.input.orderByJoinDateTime,
            }),
            findVRChatWorldJoinLogFromPhotoList({
              gtJoinDateTime: ctx.input.gtJoinDateTime,
              ltJoinDateTime: ctx.input.ltJoinDateTime,
              orderByJoinDateTime: ctx.input.orderByJoinDateTime,
            }),
          ]);

          // 写真から取得したログを通常のログの形式に変換
          const convertedPhotoLogs = photoLogs.map((log) => ({
            id: log.id,
            worldId: log.worldId,
            worldName: log.worldId, // 写真からは取得できない
            worldInstanceId: '', // 写真からは取得できない
            joinDateTime: log.joinDate,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
          }));

          // 通常のログを純粋なオブジェクトに変換
          const convertedNormalLogs = normalLogs.map((log) => ({
            id: log.id,
            worldId: log.worldId,
            worldName: log.worldName,
            worldInstanceId: log.worldInstanceId,
            joinDateTime: log.joinDateTime,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
          }));

          // 日時でソート
          const allLogs = [...convertedNormalLogs, ...convertedPhotoLogs].sort(
            (a, b) => {
              const comparison =
                a.joinDateTime.getTime() - b.joinDateTime.getTime();
              return ctx.input.orderByJoinDateTime === 'asc'
                ? comparison
                : -comparison;
            },
          );

          return allLogs;
        },
      ),
  });
