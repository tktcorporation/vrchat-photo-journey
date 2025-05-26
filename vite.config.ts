import { join } from 'node:path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import type { ConfigEnv, UserConfig } from 'vite';

const srcRoot = join(__dirname, 'src');

export default ({ command }: ConfigEnv): UserConfig => {
  // DEV
  if (command === 'serve') {
    return {
      root: srcRoot,
      base: '/',
      plugins: [react()],
      resolve: {
        alias: {
          '@': srcRoot,
          '@electron': join(__dirname, 'electron'),
          '@shared': join(__dirname, 'shared'),
        },
      },
      build: {
        outDir: join(srcRoot, '/out'),
        emptyOutDir: true,
        rollupOptions: {
          external: ['@sentry/electron', '@sentry/electron/main'],
        },
        sourcemap: true,
      },
      server: {
        port: process.env.PORT === undefined ? 3000 : +process.env.PORT,
      },
      optimizeDeps: {
        exclude: ['path'],
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN),
      },
    };
  }
  // PROD
  return {
    root: srcRoot,
    base: './',
    plugins: [
      react(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      }),
    ],
    resolve: {
      alias: {
        '@': srcRoot,
        '@electron': join(__dirname, 'electron'),
        '@shared': join(__dirname, 'shared'),
      },
    },
    build: {
      outDir: join(srcRoot, '/out'),
      emptyOutDir: true,
      rollupOptions: {
        external: ['@sentry/electron', '@sentry/electron/main'],
      },
      sourcemap: true,
    },
    server: {
      port: process.env.PORT === undefined ? 3000 : +process.env.PORT,
    },
    optimizeDeps: {
      exclude: ['path'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN),
    },
  };
};
