/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  asar: true,
  // node_modules を削除する検討
  files: ['main', 'src/out', 'node_modules/**/*'],
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
    target: 'dmg',
    identity: null,
    icon: 'assets/icon.icns',
  },
};

module.exports = config;
