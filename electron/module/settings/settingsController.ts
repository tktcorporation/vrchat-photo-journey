import * as sequelizeLib from '../../lib/sequelize';
import { procedure, router as trpcRouter } from './../../trpc';
import * as settingService from './service';
import { getWindow } from '../../electronUtil';
import { UpdateCheckResult } from 'electron-updater';

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
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    checkForUpdates: procedure.query(async () => {
      return await settingService.getElectronUpdaterInfo();
    }),
    installUpdatesAndReload: procedure.mutation(async () => {
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    checkForUpdatesAndReturnResult: procedure.query(async (): Promise<{
      isUpdateAvailable: boolean;
      updateInfo: UpdateCheckResult | null;
    }> => {
      const updateInfo = await settingService.getElectronUpdaterInfo();
      return {
        isUpdateAvailable: updateInfo.isUpdateAvailable,
        updateInfo: updateInfo.updateInfo,
      };
    }),
    installUpdatesAndReloadApp: procedure.mutation(async () => {
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
  });
