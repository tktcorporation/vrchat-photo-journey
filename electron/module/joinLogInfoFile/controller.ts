import {
  eventEmitter,
  logError,
  procedure,
  router as trpcRouter,
} from './../../trpc';
import type { getSettingStore } from './../settingStore';
import * as joinLogInfoFileService from './service';

export const joinInfoLogFileRouter = (
  settingStore: ReturnType<typeof getSettingStore>,
) =>
  trpcRouter({
    createFiles: procedure.mutation(async () => {
      const result =
        await joinLogInfoFileService.getConfigAndValidateAndCreateFiles(
          settingStore,
        )();
      return result.match(
        () => {
          eventEmitter.emit('toast', 'ファイルの作成に成功しました');
          return true;
        },
        (error) => {
          logError(error);
          return false;
        },
      );
    }),
  });
