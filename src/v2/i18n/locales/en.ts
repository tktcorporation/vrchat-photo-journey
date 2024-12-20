import type { Translations } from '../types';

const en: Translations = {
  common: {
    settings: 'Settings',
    close: 'Close',
    loading: 'Loading...',
    noPhotosFound: 'No photos found',
    photos: 'photos',
    refresh: 'Check for new photos',
    search: {
      placeholder: 'Search photos...',
    },
  },
  settings: {
    tabs: {
      dataSource: 'Data Source',
      theme: 'Theme',
      system: 'System',
      info: 'Information',
      license: 'License Information',
    },
    system: {
      title: 'System Settings',
      startupLaunch: 'Startup Launch',
      startupDescription: 'Automatically start the application when logging in',
      backgroundUpdate: 'Background Update',
      backgroundDescription: 'Check for new photos in the background',
      updateInterval: 'Update Interval',
      updateIntervalDescription: 'Frequency of checking for new photos',
      notifications: 'Show Notifications',
      notificationsDescription: 'Show notifications when new photos are found',
      interval: {
        '5min': '5 minutes',
        '15min': '15 minutes',
        '30min': '30 minutes',
        '1hour': '1 hour',
      },
    },
    paths: {
      useDemo: 'Use Demo Data',
      useLocal: 'Use Local Files',
      photoDirectory: 'Photo Directory',
      logFile: 'Log File',
      browse: 'Browse',
      validate: 'Validate Paths',
      validating: 'Validating...',
      logFormat: {
        title: 'Log File Format',
        description:
          'The log file must be a JSON file with the following format:',
      },
    },
    info: {
      version: 'Version',
      name: 'Name',
      dependencies: 'Major Dependencies',
      licenses: {
        title: 'License Information',
        viewLicense: 'View License',
        suffix: 'License',
      },
    },
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
  },
  photoModal: {
    visitedWith: 'Visited with',
    tags: 'Tags',
    resolution: 'Resolution',
    lastVisited: 'Last visited',
    recommendedSeason: 'Best season',
  },
  pullToRefresh: {
    pull: 'Pull to refresh',
    release: 'Release to refresh',
    refreshing: 'Refreshing...',
    checking: 'Checking for new photos...',
  },
  yearlyVisitors: 'Annual visitors',
};

export default en;
