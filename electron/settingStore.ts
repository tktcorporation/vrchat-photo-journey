import Store from 'electron-store';
import * as neverthrow from 'neverthrow';

type storeName = 'v0-settings' | 'test-settings';

const settingStoreKey = [
  'logFilesDir',
  'vrchatPhotoDir',
  'removeAdjacentDuplicateWorldEntriesFlag',
] as const;
export type SettingStoreKey = (typeof settingStoreKey)[number];

const getValue =
  (settingsStore: Store) =>
  (key: SettingStoreKey): unknown => {
    const value = settingsStore.get(key);
    return value;
  };

const setValue =
  (settingsStore: Store) => (key: SettingStoreKey, value: unknown) => {
    settingsStore.set(key, value);
  };

const getStr =
  (get: (key: SettingStoreKey) => unknown) =>
  (key: SettingStoreKey): string | null => {
    const value = get(key);
    if (typeof value !== 'string') {
      return null;
    }
    return value;
  };

const getBool =
  (get: (key: SettingStoreKey) => unknown) =>
  (key: SettingStoreKey): boolean | null => {
    const value = get(key);
    if (typeof value !== 'boolean') {
      return null;
    }
    return value;
  };

const getLogFilesDir =
  (getS: (key: SettingStoreKey) => string | null) => (): string | null => {
    return getS('logFilesDir');
  };
const setLogFilesDir =
  (set: (key: SettingStoreKey, value: unknown) => void) =>
  (dirPath: string) => {
    set('logFilesDir', dirPath);
  };

const getVRChatPhotoDir =
  (getS: (key: SettingStoreKey) => string | null) => (): string | null => {
    return getS('vrchatPhotoDir');
  };
const setVRChatPhotoDir =
  (set: (key: SettingStoreKey, value: unknown) => void) =>
  (dirPath: string) => {
    set('vrchatPhotoDir', dirPath);
  };

/**
 * 連続して同じワールドに入った場合に、2回目以降のワールド入場ログを削除するかどうか
 */
const getRemoveAdjacentDuplicateWorldEntriesFlag =
  (getB: (key: SettingStoreKey) => boolean | null) => (): boolean | null => {
    const value = getB('removeAdjacentDuplicateWorldEntriesFlag');
    if (typeof value !== 'boolean') {
      return null;
    }
    return value;
  };
const setRemoveAdjacentDuplicateWorldEntriesFlag =
  (set: (key: SettingStoreKey, value: unknown) => void) => (flag: boolean) => {
    set('removeAdjacentDuplicateWorldEntriesFlag', flag);
  };

/**
 * Clear all settings
 */
const clearAllStoredSettings = (settingsStore: Store) => () => {
  settingsStore.clear();
};

/**
 * Clear stored setting by key
 */
const clearStoredSetting =
  (settingsStore: Store) =>
  (key: SettingStoreKey): neverthrow.Result<void, Error> => {
    try {
      return neverthrow.ok(settingsStore.delete(key));
    } catch (error) {
      if (error instanceof Error) {
        return neverthrow.err(error);
      }
      throw error;
    }
  };

const getSettingStore = (name: storeName) => {
  const settingStore = new Store({ name });
  const { get, set } = {
    get: getValue(settingStore),
    set: setValue(settingStore),
  };
  const { getStr: getS, getBool: getB } = {
    getStr: getStr(get),
    getBool: getBool(get),
  };
  return {
    getLogFilesDir: getLogFilesDir(getS),
    setLogFilesDir: setLogFilesDir(set),
    getVRChatPhotoDir: getVRChatPhotoDir(getS),
    setVRChatPhotoDir: setVRChatPhotoDir(set),
    getRemoveAdjacentDuplicateWorldEntriesFlag:
      getRemoveAdjacentDuplicateWorldEntriesFlag(getB),
    setRemoveAdjacentDuplicateWorldEntriesFlag:
      setRemoveAdjacentDuplicateWorldEntriesFlag(set),
    clearAllStoredSettings: clearAllStoredSettings(settingStore),
    clearStoredSetting: clearStoredSetting(settingStore),
  };
};

export { getSettingStore };
