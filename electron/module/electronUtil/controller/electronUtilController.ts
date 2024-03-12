import z from 'zod';
import * as utilsService from '../../service/utilsService';
import { procedure, router as trpcRouter } from './../../../trpc';

export const electronUtilRouter = () =>
  trpcRouter({
    openUrlInDefaultBrowser: procedure
      .input(z.string())
      .mutation(async (ctx) => {
        console.log('openUrlInDefaultBrowser', ctx.input);
        await utilsService.openUrlInDefaultBrowser(ctx.input);
      }),
    reloadWindow: procedure.mutation(async () => {
      console.log('reloadWindow');
      await utilsService.reloadWindow();
    }),
  });
