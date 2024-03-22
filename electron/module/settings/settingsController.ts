import path from 'node:path';
import { app } from 'electron';
import { procedure, router as trpcRouter } from './../../trpc';

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      const packageJsonPath = path.join(app.getAppPath(), 'package.json');
      const { version } = await import(packageJsonPath);
      if (version === undefined) {
        throw new Error('version is undefined');
      }
      return version;
    }),
  });
