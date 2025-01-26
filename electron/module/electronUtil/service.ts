import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { app, dialog, shell } from 'electron';
import * as neverthrow from 'neverthrow';

const openPathInExplorer = async (
  path: string,
): Promise<neverthrow.Result<string, Error>> => {
  // ネイティブの機能を使う
  try {
    const result = await shell.openPath(path);
    return neverthrow.ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return neverthrow.err(error);
    }
    throw error;
  }
};

export const getApplicationLogPath = (): string => {
  return app.getPath('logs');
};

const openGetDirDialog = async (): Promise<
  neverthrow.Result<string, 'canceled'>
> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled) {
    return neverthrow.err('canceled');
  }
  return neverthrow.ok(result.filePaths[0]);
};

const openGetFileDialog = async (
  properties: Array<'openDirectory' | 'openFile' | 'multiSelections'>,
): Promise<neverthrow.Result<string[], 'canceled'>> => {
  const result = await dialog.showOpenDialog({
    properties,
  });
  if (result.canceled) {
    return neverthrow.err('canceled');
  }
  return neverthrow.ok(result.filePaths);
};

const openUrlInDefaultBrowser = (url: string) => {
  return shell.openExternal(url);
};

const openPhotoPathWithPhotoApp = (path: string) => {
  return shell.openPath(path);
};

interface SavePngFileOptions {
  pngBase64: string;
  filenameWithoutExt: string;
}

export const handlePngBase64WithCallback = async (
  options: SavePngFileOptions,
  callback: (tempPngPath: string) => Promise<void>,
): Promise<void> => {
  let tempDir = '';
  try {
    const base64Data = options.pngBase64.replace(
      /^data:image\/[^;]+;base64,/,
      '',
    );
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vrchat-photo-'));
    const tempFilePath = path.join(
      tempDir,
      `${options.filenameWithoutExt}.png`,
    );
    const imageBuffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(tempFilePath, new Uint8Array(imageBuffer));
    await callback(tempFilePath);
  } catch (error) {
    console.error('Failed to handle png file:', error);
    throw new Error('Failed to handle png file', { cause: error });
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary directory:', cleanupError);
      }
    }
  }
};

export const showSavePngDialog = async (filenameWithoutExt: string) => {
  return dialog.showSaveDialog({
    defaultPath: path.join(
      os.homedir(),
      'Downloads',
      `${filenameWithoutExt}.png`,
    ),
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
};

export const saveFileToPath = async (
  sourcePath: string,
  destinationPath: string,
): Promise<void> => {
  await fs.copyFile(sourcePath, destinationPath);
};

export {
  openPathInExplorer,
  openGetDirDialog,
  openGetFileDialog,
  openUrlInDefaultBrowser,
  openPhotoPathWithPhotoApp,
};
