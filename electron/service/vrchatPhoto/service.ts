import * as fs from '../../lib/wrappedFs';

import * as settingStore from '../../settingStore';

const getVRChatPhotoDir = (): {
  storedPath: string | null;
  error: null | 'photoYearMonthDirsNotFound' | 'photoDirReadError';
} => {
  const storedPath = settingStore.getVRChatPhotoDir();
  if (storedPath === null) {
    return { storedPath, error: null };
  }
  // 指定されたdir になにがあるか調べる
  const dirNames = fs.readDirSyncSafe(storedPath);
  if (dirNames.isErr()) {
    return { storedPath, error: 'photoDirReadError' };
  }
  // 写真が保存されていれば作成されているはずの year-month ディレクトリを取得
  const yearMonthDirNames = dirNames.value.filter((dirName) => /^\d{4}-\d{2}$/.test(dirName));
  if (yearMonthDirNames.length === 0) {
    return { storedPath, error: 'photoYearMonthDirsNotFound' };
  }
  return { storedPath, error: null };
};

export { getVRChatPhotoDir };
