import { procedure, router as trpcRouter } from './../../trpc';

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      const version = process.env.npm_package_version;
      if (version === undefined) {
        throw new Error('version is undefined');
      }
      return version;
    }),
  });
