import { join } from 'path';
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
        },
      },
      build: {
        outDir: join(srcRoot, '/out'),
        emptyOutDir: true,
        rollupOptions: {},
        sourcemap: true,
      },
      server: {
        port: process.env.PORT === undefined ? 3000 : +process.env.PORT,
      },
      optimizeDeps: {
        exclude: ['path'],
      },
    };
  }
  // PROD
  return {
    root: srcRoot,
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': srcRoot,
      },
    },
    build: {
      outDir: join(srcRoot, '/out'),
      emptyOutDir: true,
      rollupOptions: {},
      sourcemap: true,
    },
    server: {
      port: process.env.PORT === undefined ? 3000 : +process.env.PORT,
    },
    optimizeDeps: {
      exclude: ['path'],
    },
  };
};
