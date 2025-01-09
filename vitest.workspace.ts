import path from 'node:path';
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    // フロントエンド用の設定
    extends: './vitest.config.ts',
    test: {
      name: 'web',
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    },
  },
  {
    // Electron/Node.js用の設定
    extends: './vitest.config.ts',
    test: {
      name: 'electron',
      environment: 'node',
      include: ['electron/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    },
  },
]);
