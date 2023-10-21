import Store from 'electron-store';

const settingsStore = new Store({ name: 'v0-settings' });

const settingStoreKey = ['logFilesDir', 'vrchatPhotoDir'] as const;
export type SettingStoreKey = typeof settingStoreKey[number];

const get = (key: SettingStoreKey): string | null => {
  const value = settingsStore.get(key);
  if (typeof value !== 'string') {
    return null;
  }
  return value;
};

const set = (key: SettingStoreKey, value: string) => {
  settingsStore.set(key, value);
};

const getLogFilesDir = (): string | null => {
  return get('logFilesDir');
};
const setLogFilesDir = (dirPath: string) => {
  set('logFilesDir', dirPath);
};

const getVRChatPhotoDir = (): string | null => {
  return get('vrchatPhotoDir');
};
const setVRChatPhotoDir = (dirPath: string) => {
  set('vrchatPhotoDir', dirPath);
};

export { getLogFilesDir, setLogFilesDir, getVRChatPhotoDir, setVRChatPhotoDir };
