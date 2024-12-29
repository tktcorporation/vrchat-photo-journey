/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  asar: true,
  files: ['main', 'src/out'],
  directories: {
    buildResources: 'resources',
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
  },
  linux: {
    target: 'AppImage',
  },
  mac: {
    target: 'dmg',
    identity: null,
  },
};

module.exports = config;
