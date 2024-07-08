import path from 'node:path';
import sharp from 'sharp';
import z from 'zod';
import { getWindow } from '../../../electronUtil';
import { procedure, router as trpcRouter } from './../../../trpc';
import * as utilsService from './../service';

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
    getVRChatPhotoItemData: procedure.input(z.string()).query(async (ctx) => {
      const photoBuf = await sharp(ctx.input).resize(256).toBuffer();
      return `data:image/${path
        .extname(ctx.input)
        .replace('.', '')};base64,${photoBuf.toString('base64')}`;
    }),
  });
