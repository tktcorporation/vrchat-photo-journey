import { procedure, router } from '../../trpc';
import { UpdaterService } from './service';

const updaterService = new UpdaterService();

export const updaterRouter = router({
  checkForUpdates: procedure.mutation(async () => {
    await updaterService.checkForUpdates();
  }),

  quitAndInstall: procedure.mutation(async () => {
    await updaterService.quitAndInstall();
  }),

  getUpdateStatus: procedure.query(() => {
    return {
      updateDownloaded: updaterService.getUpdateDownloaded(),
    };
  }),
});
