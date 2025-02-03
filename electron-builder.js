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
  extraResources: ['./src/assets/**'],
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
    icon: 'build/icons/icon.ico',
  },
  linux: {
    target: 'AppImage',
    icon: 'build/icons',
  },
  mac: {
    target: 'dmg',
    identity: null,
    icon: 'build/icons/icon.icns',
  },
};

module.exports = config;
