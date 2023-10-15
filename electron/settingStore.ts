import Store from 'electron-store';

const settingsStore = new Store({ name: 'v0-settings' });

const settingStoreKey = ['logFilesDir', 'vrchatPhotoDir'] as const;
export type SettingStoreKey = typeof settingStoreKey[number];

export const get = (key: SettingStoreKey) => {
  const value = settingsStore.get(key);
  if (typeof value !== 'string') {
    return '';
  }
  return value;
};

export const set = (key: SettingStoreKey, value: string) => {
  settingsStore.set(key, value);
};
