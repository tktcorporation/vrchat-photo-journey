import z from 'zod';
import { procedure, router as trpcRouter } from '../../trpc';
import * as vrchatWorldJoinLogService from './service';

export const vrchatWorldJoinLogRouter = () =>
  trpcRouter({
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
