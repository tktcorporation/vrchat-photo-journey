import z from 'zod';
import { procedure, router as trpcRouter } from '../../trpc';
import * as vrchatWorldJoinLogService from './service';

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
      .query(async (ctx) => {
        const result =
          await vrchatWorldJoinLogService.findVRChatWorldJoinLogList({
            gtJoinDateTime: ctx.input.gtJoinDateTime,
            ltJoinDateTime: ctx.input.ltJoinDateTime,
            orderByJoinDateTime: ctx.input.orderByJoinDateTime,
          });
        return result;
      }),
  });
