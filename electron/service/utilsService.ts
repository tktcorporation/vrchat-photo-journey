import { shell } from 'electron';
import * as neverthrow from 'neverthrow';

const openPathInExplorer = async (path: string): Promise<neverthrow.Result<string, Error>> => {
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

export { openPathInExplorer };
