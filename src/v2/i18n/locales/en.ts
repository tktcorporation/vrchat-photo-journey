import type { Translations } from '../types';

const en: Translations = {
  common: {
    settings: 'Settings',
    close: 'Close',
    loading: 'Loading...',
    noPhotosFound: 'No photos found',
    photos: 'Photos',
    refresh: 'Refresh',
    showingEmptyGroups: 'Show groups without photos',
    hidingEmptyGroups: 'Hide groups without photos',
    search: {
      placeholder: 'Search...',
    },
    toast: {
      settingsDeleted: 'Settings deleted',
      allSettingsDeleted: 'All settings deleted',
      logFilePathSet: 'VRChat log file path has been set',
    },
    contextMenu: {
      copyPhotoData: 'Copy',
      openInPhotoApp: 'Open in Photo App',
      showInExplorer: 'Show in Folder',
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
      startupError: 'Failed to update startup launch setting',
      startupSuccess: 'Startup launch setting updated',
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
      title: 'App Info',
      version: 'Version',
      name: 'Name',
      dependencies: 'Major Dependencies',
      openLog: 'Open App Log',
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
  terms: {
    title: 'Terms of Service and Privacy Policy',
    updateTitle: 'Terms of Service and Privacy Policy Update',
    accept: 'Accept',
  },
};

export default en;
