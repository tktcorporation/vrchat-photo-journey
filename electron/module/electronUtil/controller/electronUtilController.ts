import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { clipboard, nativeImage } from 'electron';
import * as path from 'pathe';
import sharp from 'sharp';
import z from 'zod';
import { getWindow } from '../../../electronUtil';
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
    copyImageDataByPath: procedure.input(z.string()).mutation(async (ctx) => {
      const photoBuf = await sharp(ctx.input).toBuffer();
      const image = nativeImage.createFromBuffer(photoBuf);
      clipboard.writeImage(image);
      eventEmitter.emit('toast', 'copied');
    }),
    copyImageDataByBase64: procedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string().optional(),
        }),
      )
      .mutation(async (ctx) => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'vrchat-photo-'),
        );
        const filename = ctx.input.filename || 'image.png';
        const tempFilePath = path.join(tempDir, filename);

        try {
          // Base64をバッファに変換
          const buffer = Buffer.from(ctx.input.base64, 'base64');

          // 一時ファイルに保存
          await fs.writeFile(tempFilePath, new Uint8Array(buffer));

          // 一時ファイルをクリップボードにコピー
          const image = nativeImage.createFromPath(tempFilePath);
          clipboard.writeImage(image);

          eventEmitter.emit('toast', 'copied');
        } finally {
          // 一時ファイルとディレクトリを削除
          await fs.rm(tempDir, { recursive: true, force: true });
        }
      }),
    openPhotoPathWithPhotoApp: procedure
      .input(z.string())
      .mutation(async (ctx) => {
        await utilsService.openPhotoPathWithPhotoApp(ctx.input);
      }),
  });
