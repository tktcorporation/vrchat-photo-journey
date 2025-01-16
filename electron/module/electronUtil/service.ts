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

export {
  openPathInExplorer,
  openGetDirDialog,
  openGetFileDialog,
  openUrlInDefaultBrowser,
  openPhotoPathWithPhotoApp,
};
