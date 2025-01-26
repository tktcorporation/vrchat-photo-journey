import * as datefns from 'date-fns';
import { clipboard, nativeImage } from 'electron';
import * as path from 'pathe';
import sharp from 'sharp';
import z from 'zod';
import { getWindow } from '../../../electronUtil';
import * as exiftool from '../../../lib/wrappedExifTool';
import { eventEmitter, procedure, router as trpcRouter } from './../../../trpc';
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
    copyTextToClipboard: procedure.input(z.string()).mutation(async (ctx) => {
      clipboard.writeText(ctx.input);
      eventEmitter.emit('toast', 'copied');
    }),
    copyImageDataByPath: procedure.input(z.string()).mutation(async (ctx) => {
      const photoBuf = await sharp(ctx.input).toBuffer();
      const image = nativeImage.createFromBuffer(photoBuf);
      clipboard.writeImage(image);
      eventEmitter.emit('toast', 'copied');
    }),
    downloadImageAsPng: procedure
      .input(
        z.object({
          pngBase64: z.string(),
          filenameWithoutExt: z.string(),
        }),
      )
      .mutation(async (ctx) => {
        await utilsService.handlePngBase64WithCallback(
          {
            filenameWithoutExt: ctx.input.filenameWithoutExt,
            pngBase64: ctx.input.pngBase64,
          },
          async (tempPngPath) => {
            const dialogResult = await utilsService.showSavePngDialog(
              ctx.input.filenameWithoutExt,
            );

            if (dialogResult.canceled || !dialogResult.filePath) {
              return;
            }

            await utilsService.saveFileToPath(
              tempPngPath,
              dialogResult.filePath,
            );
            eventEmitter.emit('toast', 'downloaded');
          },
        );
      }),
    downloadImageAsPhotoLogPng: procedure
      .input(
        z.object({
          worldId: z.string().regex(/^wrld_.+$/),
          joinDateTime: z.date(),
          imageBase64: z.string(),
        }),
      )
      .mutation(async (ctx) => {
        const filename = `VRChat_${datefns.format(
          ctx.input.joinDateTime,
          'yyyy-MM-dd_HH-mm-ss.SSS',
        )}_${ctx.input.worldId}`;

        await utilsService.handlePngBase64WithCallback(
          {
            filenameWithoutExt: filename,
            pngBase64: ctx.input.imageBase64,
          },
          async (tempPngPath) => {
            const dialogResult = await utilsService.showSavePngDialog(filename);

            if (dialogResult.canceled || !dialogResult.filePath) {
              return;
            }

            // Write EXIF data with timezone
            await exiftool.writeDateTimeWithTimezone({
              filePath: tempPngPath,
              description: ctx.input.worldId,
              dateTimeOriginal: datefns.format(
                ctx.input.joinDateTime,
                'yyyy-MM-dd HH:mm:ss',
              ),
              timezoneOffset: datefns.format(ctx.input.joinDateTime, 'xxx'),
            });

            // Move the temp file to the final destination
            await utilsService.saveFileToPath(
              tempPngPath,
              dialogResult.filePath,
            );

            eventEmitter.emit('toast', 'downloaded');
          },
        );
      }),
    copyImageDataByBase64: procedure
      .input(
        z.object({
          pngBase64: z.string(),
          filenameWithoutExt: z.string(),
        }),
      )
      .mutation(async (ctx) => {
        await utilsService.handlePngBase64WithCallback(
          {
            filenameWithoutExt: ctx.input.filenameWithoutExt,
            pngBase64: ctx.input.pngBase64,
          },
          async (tempPngPath) => {
            const image = nativeImage.createFromPath(tempPngPath);
            clipboard.writeImage(image);
            eventEmitter.emit('toast', 'copied');
          },
        );
      }),
    openPhotoPathWithPhotoApp: procedure
      .input(z.string())
      .mutation(async (ctx) => {
        await utilsService.openPhotoPathWithPhotoApp(ctx.input);
      }),
  });
