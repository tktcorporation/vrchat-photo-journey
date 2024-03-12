import z from 'zod';
import { getWindow } from '../../../electronUtil';
import * as utilsService from '../../service/utilsService';
import { procedure, router as trpcRouter } from './../../../trpc';

const reloadWindow = () => {
  const mainWindow = getWindow();
  if (mainWindow) {
    mainWindow.reload();
  }
};

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
      await reloadWindow();
    }),
  });
