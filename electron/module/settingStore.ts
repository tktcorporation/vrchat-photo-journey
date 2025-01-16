import type { Rectangle } from 'electron';
import Store from 'electron-store';
import * as neverthrow from 'neverthrow';

type storeName = 'v0-settings' | 'test-settings';

const settingStoreKey = [
  'logFilesDir',
  'vrchatPhotoDir',
  'vrchatPhotoExtraDirList',
  'removeAdjacentDuplicateWorldEntriesFlag',
  'backgroundFileCreateFlag',
  'termsAccepted',
  'termsVersion',
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
 * バックグラウンドでファイル作成処理を行うかどうか
 */
const setBackgroundFileCreateFlag =
  (set: (key: SettingStoreKey, value: unknown) => void) => (flag: boolean) => {
    set('backgroundFileCreateFlag', flag);
  };

const getBackgroundFileCreateFlag =
  (getB: (key: SettingStoreKey) => boolean | null) => (): boolean | null => {
    const value = getB('backgroundFileCreateFlag');
    if (typeof value !== 'boolean') {
      return null;
    }
    return value;
  };

/**
 * 規約同意状態
 */
const getTermsAccepted =
  (getB: (key: SettingStoreKey) => boolean | null) => (): boolean => {
    const value = getB('termsAccepted');
    return value ?? false;
  };

const setTermsAccepted =
  (set: (key: SettingStoreKey, value: unknown) => void) => (flag: boolean) => {
    set('termsAccepted', flag);
  };

const getTermsVersion =
  (getS: (key: SettingStoreKey) => string | null) => (): string => {
    const value = getS('termsVersion');
    return value ?? '';
  };

const setTermsVersion =
  (set: (key: SettingStoreKey, value: unknown) => void) =>
  (version: string) => {
    set('termsVersion', version);
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

import path from 'node:path';
import * as log from './../lib/logger';
let settingStore: ReturnType<typeof setSettingStore> | null = null;
const setSettingStore = (name: storeName) => {
  const store = new Store({ name });
  const { get, set } = {
    get: getValue(store),
    set: setValue(store),
  };
  const { getStr: getS, getBool: getB } = {
    getStr: getStr(get),
    getBool: getBool(get),
  };
  const getVRChatPhotoExtraDirList = () => (): string[] => {
    const value = get('vrchatPhotoExtraDirList');
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  };

  const setVRChatPhotoExtraDirList =
    (set: (key: SettingStoreKey, value: unknown) => void) =>
    (dirPaths: string[]) => {
      set('vrchatPhotoExtraDirList', dirPaths);
    };

  const _settingStore = {
    __store: store,
    getLogFilesDir: getLogFilesDir(getS),
    setLogFilesDir: setLogFilesDir(set),
    getVRChatPhotoDir: getVRChatPhotoDir(getS),
    setVRChatPhotoDir: setVRChatPhotoDir(set),
    getVRChatPhotoExtraDirList: getVRChatPhotoExtraDirList(),
    setVRChatPhotoExtraDirList: setVRChatPhotoExtraDirList(set),
    getRemoveAdjacentDuplicateWorldEntriesFlag:
      getRemoveAdjacentDuplicateWorldEntriesFlag(getB),
    setRemoveAdjacentDuplicateWorldEntriesFlag:
      setRemoveAdjacentDuplicateWorldEntriesFlag(set),
    getBackgroundFileCreateFlag: getBackgroundFileCreateFlag(getB),
    setBackgroundFileCreateFlag: setBackgroundFileCreateFlag(set),
    clearAllStoredSettings: clearAllStoredSettings(store),
    clearStoredSetting: clearStoredSetting(store),
    setWindowBounds: (bounds: Rectangle) => {
      store.set('windowBounds', bounds);
    },
    getWindowBounds: (): Rectangle | undefined => {
      const bounds = store.get('windowBounds');
      if (
        bounds &&
        typeof bounds === 'object' &&
        'x' in bounds &&
        'y' in bounds &&
        'width' in bounds &&
        'height' in bounds
      ) {
        return bounds as Rectangle;
      }
      return undefined;
    },
    getTermsAccepted: getTermsAccepted(getB),
    setTermsAccepted: setTermsAccepted(set),
    getTermsVersion: getTermsVersion(getS),
    setTermsVersion: setTermsVersion(set),
  };
  settingStore = _settingStore;
  return _settingStore;
};

const initSettingStore = (name: storeName) => {
  if (settingStore !== null) {
    const existsPath = settingStore.__store.path;
    const existsName = path.basename(existsPath, '.json');
    log.info(
      `SettingStore already initialized. existsName: ${existsName}, newName: ${name}。file: ${existsPath}`,
    );
    if (existsName === name) {
      return getSettingStore();
    }
    throw new Error('SettingStore already initialized');
  }
  setSettingStore(name);
  return getSettingStore();
};
const initSettingStoreForTest = (
  settingStoreSpy: ReturnType<typeof getSettingStore>,
) => {
  settingStore = settingStoreSpy;
};
const getSettingStore = () => {
  if (settingStore === null) {
    throw new Error('SettingStore not initialized');
  }
  return settingStore;
};

export interface SettingStore {
  __store: Store<Record<string, unknown>>;
  getLogFilesDir: () => string | null;
  setLogFilesDir: (dirPath: string) => void;
  getVRChatPhotoDir: () => string | null;
  setVRChatPhotoDir: (dirPath: string) => void;
  getVRChatPhotoExtraDirList: () => string[];
  setVRChatPhotoExtraDirList: (dirPaths: string[]) => void;
  getRemoveAdjacentDuplicateWorldEntriesFlag: () => boolean | null;
  setRemoveAdjacentDuplicateWorldEntriesFlag: (flag: boolean) => void;
  getBackgroundFileCreateFlag: () => boolean | null;
  setBackgroundFileCreateFlag: (flag: boolean) => void;
  clearAllStoredSettings: () => void;
  clearStoredSetting: (key: SettingStoreKey) => neverthrow.Result<void, Error>;
  getWindowBounds: () => Rectangle | undefined;
  setWindowBounds: (bounds: Rectangle) => void;
  getTermsAccepted: () => boolean;
  setTermsAccepted: (accepted: boolean) => void;
  getTermsVersion: () => string;
  setTermsVersion: (version: string) => void;
}

export { getSettingStore, initSettingStore, initSettingStoreForTest };
