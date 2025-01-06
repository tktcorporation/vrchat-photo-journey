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
  return dialog
    .showOpenDialog({
      properties: ['openDirectory'],
    })
    .then((result) => {
      if (!result.canceled) {
        return neverthrow.ok(result.filePaths[0]);
      }
      return neverthrow.err('canceled' as const);
    })
    .catch((err) => {
      throw err;
    });
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
  openUrlInDefaultBrowser,
  openPhotoPathWithPhotoApp,
};
