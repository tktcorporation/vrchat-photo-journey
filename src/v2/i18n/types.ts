export type Language = 'en' | 'ja';

export interface Translations {
  common: {
    photoGallery: string;
    settings: string;
    close: string;
    loading: string;
    noPhotosFound: string;
    photos: string;
    refresh: string;
    search: {
      placeholder: string;
    };
  };
  settings: {
    tabs: {
      dataSource: string;
      theme: string;
      info: string;
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
      version: string;
      name: string;
      dependencies: string;
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
