export type Language = 'en' | 'ja';

// 翻訳キーのパスを生成するための型
export type RecursiveKeyOf<TObj> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends Record<
    string,
    unknown
  >
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

// 翻訳キーの型
export type TranslationKey = RecursiveKeyOf<Translations>;

export interface Translations {
  common: {
    settings: string;
    close: string;
    loading: string;
    noPhotosFound: string;
    photos: string;
    refresh: string;
    search: {
      placeholder: string;
    };
    toast: {
      settingsDeleted: string;
      allSettingsDeleted: string;
      logFilePathSet: string;
    };
  };
  settings: {
    tabs: {
      dataSource: string;
      theme: string;
      system: string;
      info: string;
      license: string;
    };
    system: {
      title: string;
      startupLaunch: string;
      startupDescription: string;
      backgroundUpdate: string;
      backgroundDescription: string;
      updateInterval: string;
      updateIntervalDescription: string;
      notifications: string;
      notificationsDescription: string;
      interval: {
        '5min': string;
        '15min': string;
        '30min': string;
        '1hour': string;
      };
    };
    theme: {
      title: string;
      system: string;
      dark: string;
      light: string;
    };
    paths: {
      useDemo: string;
      useLocal: string;
      photoDirectory: string;
      logFile: string;
      browse: string;
      validate: string;
      validating: string;
      logFormat: {
        title: string;
        description: string;
      };
    };
    info: {
      title: string;
      version: string;
      name: string;
      dependencies: string;
      openLog: string;
      licenses: {
        title: string;
        viewLicense: string;
        suffix: string;
      };
    };
  };
  photoModal: {
    visitedWith: string;
    tags: string;
    resolution: string;
    lastVisited: string;
    recommendedSeason: string;
  };
  pullToRefresh: {
    pull: string;
    release: string;
    refreshing: string;
    checking: string;
  };
  yearlyVisitors: string;
}
