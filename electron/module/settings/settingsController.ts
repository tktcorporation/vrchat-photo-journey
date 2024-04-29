import * as sequelizeLib from '../../lib/sequelize';
import { procedure, router as trpcRouter } from './../../trpc';
import { getAppVersion } from './service';

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      const version = await getAppVersion();
      return version;
    }),
    forceResetDatabase: procedure.mutation(async () => {
      await sequelizeLib.syncRDBClient({
        checkRequired: false,
      });
    }),
    syncDatabase: procedure.mutation(async () => {
      await sequelizeLib.syncRDBClient();
    }),
  });
