import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'electron/index.ts',
    'electron/preload.ts',
    'electron/vite.config.ts',
    'vitest.config.ts',
  ],
  project: ['src/**/*.ts', 'src/**/*.tsx', 'electron/**/*.ts'],
  ignoreBinaries: ['@tktco/node-actionlint'],
  ignoreDependencies: ['@types/sharp', '@tktco/node-actionlint'],
};

export default config;
