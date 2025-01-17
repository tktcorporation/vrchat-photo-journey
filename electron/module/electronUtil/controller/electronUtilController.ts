import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { clipboard, dialog, nativeImage } from 'electron';
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
    downloadImageAsPng: procedure
      .input(
        z.object({
          pngBase64: z.string(),
          filenameWithoutExt: z.string(),
        }),
      )
      .mutation(async (ctx) => {
        await handlePngBase64(
          {
            filenameWithoutExt: ctx.input.filenameWithoutExt,
            pngBase64: ctx.input.pngBase64,
          },
          async (tempPngPath) => {
            // 保存先をユーザーに選択させる
            const { filePath, canceled } = await dialog.showSaveDialog({
              defaultPath: path.join(
                os.homedir(),
                'Downloads',
                `${ctx.input.filenameWithoutExt}.png`,
              ),
              filters: [
                { name: 'PNG Image', extensions: ['png'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });

            if (canceled || !filePath) {
              return;
            }

            // 選択されたパスにファイルをコピー
            await fs.copyFile(tempPngPath, filePath);

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
        handlePngBase64(
          {
            filenameWithoutExt: ctx.input.filenameWithoutExt,
            pngBase64: ctx.input.pngBase64,
          },
          async (tempPngPath) => {
            // 一時ファイルをクリップボードにコピー
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

const handlePngBase64 = async (
  {
    filenameWithoutExt,
    pngBase64,
  }: {
    filenameWithoutExt: string;
    pngBase64: string;
  },
  callback: (tempPngPath: string) => Promise<void>,
) => {
  let tempDir = '';
  try {
    // Base64データからプレフィックスを除去
    const base64Data = pngBase64.replace(/^data:image\/[^;]+;base64,/, '');

    // 一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vrchat-photo-'));
    const tempFilePath = path.join(tempDir, `${filenameWithoutExt}.png`);

    // Base64データをバッファに変換
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // ファイルに保存
    await fs.writeFile(tempFilePath, new Uint8Array(imageBuffer));

    // コールバックを実行し、完了を待つ
    await callback(tempFilePath);
  } catch (error) {
    console.error('Failed to handle png file:', error);
    eventEmitter.emit('toast', 'error');
    throw new Error('Failed to handle png file', { cause: error });
  } finally {
    // 一時ディレクトリが存在する場合のみ削除を試みる
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary directory:', cleanupError);
      }
    }
  }
};
