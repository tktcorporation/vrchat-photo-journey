import * as neverthrow from 'neverthrow';
import { openGetDirDialog } from './electronUtil/service';
import type { getSettingStore } from './settingStore';

const handleOpenDialogAndSetLogFilesDir =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<
    neverthrow.Result<'canceled' | 'dir_path_saved', Error>
  > => {
    try {
      const result = await openGetDirDialog();
      if (result.isErr()) {
        return neverthrow.ok('canceled' as const);
      }
      settingStore.setLogFilesDir(result.value);
      return neverthrow.ok('dir_path_saved' as const);
    } catch (err) {
      if (err instanceof Error) {
        return neverthrow.err(err);
      }
      throw err;
    }
  };

const handleOpenDialogAndSetVRChatPhotoDir =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<
    neverthrow.Result<'canceled' | 'dir_path_saved', Error>
  > => {
    try {
      const result = await openGetDirDialog();
      if (result.isErr()) {
        return neverthrow.ok('canceled' as const);
      }
      settingStore.setVRChatPhotoDir(result.value);
      return neverthrow.ok('dir_path_saved' as const);
    } catch (err) {
      if (err instanceof Error) {
        return neverthrow.err(err);
      }
      throw err;
    }
  };

export const getController = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  return {
    handleOpenDialogAndSetLogFilesDir:
      handleOpenDialogAndSetLogFilesDir(settingStore),
    handleOpenDialogAndSetVRChatPhotoDir:
      handleOpenDialogAndSetVRChatPhotoDir(settingStore),
  };
};
