import path from 'path';
import * as neverthrow from 'neverthrow';
import * as fs from '../../lib/wrappedFs';
import * as settingStore from '../../settingStore';

const getDefaultVRChatPhotoDir = (): string => {
  let logFilesDir = '';
  // C:\Users\[ユーザー名]\Pictures\VRChat
  if (process.platform === 'win32' && process.env.USERPROFILE) {
    const DEFAULT_VRCHAT_PHOTO_DIR = path.join(process.env.USERPROFILE || '', 'Pictures', 'VRChat');
    logFilesDir = DEFAULT_VRCHAT_PHOTO_DIR;
  } else {
    // 仮置き
    logFilesDir = path.join(process.env.HOME || '', 'Pictures', 'VRChat');
  }
  return logFilesDir;
};

const validateError = ['photoYearMonthDirsNotFound', 'photoDirReadError'] as const;
const validateVRChatPhotoDir = (dir: string): neverthrow.Result<string, (typeof validateError)[number]> => {
  const dirNames = fs.readDirSyncSafe(dir);
  if (dirNames.isErr()) {
    return neverthrow.err('photoDirReadError');
  }
  const yearMonthDirNames = dirNames.value.filter((dirName) => /^\d{4}-\d{2}$/.test(dirName));
  if (yearMonthDirNames.length === 0) {
    return neverthrow.err('photoYearMonthDirsNotFound');
  }
  return neverthrow.ok(dir);
};

const getVRChatPhotoDir = (): {
  storedPath: string | null;
  path: string;
  error: null | (typeof validateError)[number];
} => {
  const storedPath = settingStore.getVRChatPhotoDir();
  const defaultPath = getDefaultVRChatPhotoDir();

  const targetPath = storedPath ?? defaultPath;
  const validateResult = validateVRChatPhotoDir(targetPath);
  if (validateResult.isOk()) {
    return { storedPath, path: targetPath, error: null };
  }
  return { storedPath, path: targetPath, error: validateResult.error };
};

export { getVRChatPhotoDir };
