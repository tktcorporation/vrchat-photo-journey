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
    copyImageDataByBase64: procedure
      .input(
        z.object({
          svgData: z.string(),
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
          // SVGの高さを抽出
          const heightMatch = ctx.input.svgData.match(
            /viewBox="0 0 800 (\d+)"/,
          );
          const height = heightMatch ? Number.parseInt(heightMatch[1]) : 600;

          // SVGを2倍サイズでPNGに変換
          const sharpInstance = sharp(Buffer.from(ctx.input.svgData)).resize(
            800 * 2,
            height * 2,
            {
              fit: 'fill',
            },
          );

          // PNGとして保存（高品質設定）
          await sharpInstance
            .png({
              quality: 100,
              compressionLevel: 9,
            })
            .toFile(tempFilePath);

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
