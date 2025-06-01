import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.tsx', 'electron/index.ts', 'electron/preload.ts'],
  project: ['src/**/*.ts', 'src/**/*.tsx', 'electron/**/*.ts'],
};

export default config;
