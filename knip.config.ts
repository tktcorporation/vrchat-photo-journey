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
  ignoreBinaries: [],
  ignoreDependencies: ['@types/sharp', '@tktco/node-actionlint'],
  ignore: ['src/components/ui/**'],
};

export default config;
