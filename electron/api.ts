import { observable } from '@trpc/server/observable';
import z from 'zod';

import { init as initSentry } from '@sentry/electron/main';
import { backgroundSettingsRouter } from './module/backgroundSettings/controller/backgroundSettingsController';
import { electronUtilRouter } from './module/electronUtil/controller/electronUtilController';
import { openGetFileDialog } from './module/electronUtil/service';
import { logInfoRouter } from './module/logInfo/logInfoCointroller';
import * as service from './module/service';
import { initSettingStore } from './module/settingStore';
import { settingsRouter } from './module/settings/settingsController';
import { vrchatApiRouter } from './module/vrchatApi/vrchatApiController';
import { vrchatLogRouter } from './module/vrchatLog/vrchatLogController';
import { vrchatPhotoRouter } from './module/vrchatPhoto/vrchatPhoto.controller';
import { vrchatWorldJoinLogRouter } from './module/vrchatWorldJoinLog/vrchatWorldJoinLog.controller';
import {
  eventEmitter as ee,
  logError,
  procedure,
  router as trpcRouter,
} from './trpc';

// type ExtractDataTypeFromResult<R> = R extends Result<infer T, unknown>
//   ? T
//   : never;

const settingStore = initSettingStore('v0-settings');

export const router = trpcRouter({
  backgroundSettings: backgroundSettingsRouter(settingStore),
  settings: settingsRouter(),
  electronUtil: electronUtilRouter(),
  vrchatPhoto: vrchatPhotoRouter(),
  vrchatLog: vrchatLogRouter(),
  vrchatWorldJoinLog: vrchatWorldJoinLogRouter(),
  logInfo: logInfoRouter(),
  vrchatApi: vrchatApiRouter,
  subscribeToast: procedure.subscription(() => {
    return observable((emit) => {
      function onToast(text: string) {
        emit.next(text);
      }

      ee.on('toast', onToast);

      return () => {
        ee.off('toast', onToast);
      };
    });
  }),
  getVRChatLogFilesDir: procedure.query(async () => {
    const logFilesDir = service.getVRChatLogFilesDir();
    return logFilesDir;
  }),
  getStatusToUseVRChatLogFilesDir: procedure.query(async () => {
    const vrchatLogFilesDir = await service.getVRChatLogFilesDir();
    let status:
      | 'ready'
      | 'logFilesDirNotSet'
      | 'logFilesNotFound'
      | 'logFileDirNotFound' = 'ready';
    if (vrchatLogFilesDir.path === null) {
      status = 'logFilesDirNotSet';
    } else if (vrchatLogFilesDir.error !== null) {
      status = vrchatLogFilesDir.error;
    }
    return status;
  }),
  clearAllStoredSettings: procedure.mutation(async () => {
    service.clearAllStoredSettings();
    ee.emit('toast', '設定をすべて削除しました');
    return undefined;
  }),
  clearStoredSetting: procedure
    .input(z.union([z.literal('logFilesDir'), z.literal('vrchatPhotoDir')]))
    .mutation(async (ctx) => {
      const result = service.clearStoredSetting(ctx.input);
      result.match(
        () => {
          ee.emit('toast', '設定を削除しました');
          return undefined;
        },
        (error) => {
          logError(error);
          return undefined;
        },
      );
    }),
  openPathOnExplorer: procedure.input(z.string()).mutation(async (ctx) => {
    const result = await service.openPathOnExplorer(ctx.input);
    return result.match(
      () => {
        return true;
      },
      (error) => {
        logError(error);
        return false;
      },
    );
  }),
  openElectronLogOnExplorer: procedure.mutation(async () => {
    const result = await service.openElectronLogOnExplorer();
    return result.match(
      () => {
        return true;
      },
      (error) => {
        logError(error);
        return false;
      },
    );
  }),
  openDirOnExplorer: procedure.input(z.string()).mutation(async (ctx) => {
    const result = await service.openDirOnExplorer(ctx.input);
    return result.match(
      () => {
        return true;
      },
      (error) => {
        logError(error);
        return false;
      },
    );
  }),
  setVRChatLogFilesDirByDialog: procedure.mutation(async () => {
    const result = await service.setVRChatLogFilesDirByDialog();
    return result.match(
      () => {
        ee.emit('toast', 'VRChatのログファイルの保存先を設定しました');
        return true;
      },
      (error) => {
        logError(error);
        return false;
      },
    );
  }),
  getTermsAccepted: procedure.query(() => {
    return {
      accepted: settingStore.getTermsAccepted(),
      version: settingStore.getTermsVersion(),
    };
  }),
  setTermsAccepted: procedure
    .input(
      z.object({
        accepted: z.boolean(),
        version: z.string(),
      }),
    )
    .mutation(({ input }) => {
      settingStore.setTermsAccepted(input.accepted);
      settingStore.setTermsVersion(input.version);
    }),
  initializeSentry: procedure.mutation(() => {
    const hasAcceptedTerms = settingStore.getTermsAccepted();
    if (hasAcceptedTerms && process.env.NODE_ENV === 'production') {
      initSentry({
        dsn: 'https://0c062396cbe896482888204f42f947ec@o4504163555213312.ingest.us.sentry.io/4508574659837952',
        environment: process.env.NODE_ENV,
      });
    }
  }),
  getVRChatPhotoExtraDirList: procedure.query((): string[] => {
    const extraDirs = settingStore.getVRChatPhotoExtraDirList();
    return extraDirs.map((dir) => dir.value);
  }),
  setVRChatPhotoExtraDirList: procedure
    .input(z.array(z.string()))
    .mutation(({ input }) => {
      settingStore.setVRChatPhotoExtraDirList(input);
      return true;
    }),
  showOpenDialog: procedure
    .input(
      z.object({
        properties: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await openGetFileDialog(
        input.properties as Array<
          'openDirectory' | 'openFile' | 'multiSelections'
        >,
      );
      return result.match(
        (filePaths) => ({
          canceled: false,
          filePaths,
        }),
        () => ({
          canceled: true,
          filePaths: [],
        }),
      );
    }),
});

export type AppRouter = typeof router;
