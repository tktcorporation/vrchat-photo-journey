import { version } from '../../../package.json';
import { procedure, router as trpcRouter } from './../../trpc';

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      if (version === undefined) {
        throw new Error('version is undefined');
      }
      return version;
    }),
  });
