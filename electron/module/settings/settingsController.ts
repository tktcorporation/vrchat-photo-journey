import * as sequelizeLib from '../../lib/sequelize';
import { procedure, router as trpcRouter } from './../../trpc';
import * as settingService from './service';

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      const version = await settingService.getAppVersion();
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
    isDatabaseReady: procedure.query(async () => {
      const appVersion = await settingService.getAppVersion();
      return sequelizeLib.checkMigrationRDBClient(appVersion);
    }),
    getAppUpdateInfo: procedure.query(async () => {
      return await settingService.getElectronUpdaterInfo();
    }),
    installUpdate: procedure.mutation(async () => {
      return await settingService.installUpdate();
    }),
  });
