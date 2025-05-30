/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  asar: true,
  files: ['main', 'src/out'],
  directories: {
    buildResources: 'assets',
  },
  extraResources: [
    {
      from: './assets/',
      to: 'assets',
    },
  ],
  publish: [
    {
      provider: 'github',
      owner: 'tktcorporation',
      repo: 'vrchat-photo-journey',
      releaseType:
        process.env.NOT_DRAFT_RELEASE === 'true' ? 'release' : 'draft',
    },
  ],
  win: {
    target: 'nsis',
    icon: 'assets/icon.ico',
  },
  linux: {
    target: 'AppImage',
    icon: 'assets/icons',
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
    ],
    identity: null,
    icon: 'assets/icon.icns',
  },
};

module.exports = config;
