import type { UpdateCheckResult } from 'electron-updater';
import { getWindow } from '../../electronUtil';
import { UserFacingError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import * as sequelizeLib from '../../lib/sequelize';
import * as electronUtilService from '../electronUtil/service';
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
      const updateInfo = await settingService.getElectronUpdaterInfo();
      if (!updateInfo.isUpdateAvailable) {
        throw new UserFacingError('アップデートはありません。');
      }
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
    checkForUpdatesAndReturnResult: procedure.query(
      async (): Promise<{
        isUpdateAvailable: boolean;
        updateInfo: UpdateCheckResult | null;
      }> => {
        const updateInfo = await settingService.getElectronUpdaterInfo();
        return {
          isUpdateAvailable: updateInfo.isUpdateAvailable,
          updateInfo: updateInfo.updateInfo,
        };
      },
    ),
    installUpdatesAndReloadApp: procedure.mutation(async () => {
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    openApplicationLogInExploler: procedure.mutation(async () => {
      const logPath = electronUtilService.getApplicationLogPath();
      logger.debug('openApplicationLogInExploler', logPath);
      await electronUtilService.openPathInExplorer(logPath);
    }),
    throwErrorForSentryTest: procedure.mutation(async () => {
      logger.debug('Throwing test error for Sentry integration');
      const sentryTestError = new Error(
        'This is a test error for Sentry integration.',
      );
      sentryTestError.name = 'SentryTestError';
      Object.defineProperty(sentryTestError, 'additionalInfo', {
        enumerable: true,
        value: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          testProperty: 'This is a test property',
        },
      });
      throw sentryTestError;
    }),
  });
