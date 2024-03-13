import z from 'zod';
import { procedure, router as trpcRouter } from './../../../trpc';
import type { getSettingStore } from './../../settingStore';

const getIsBackgroundFileCreationEnabled =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<boolean> => {
    const flag = settingStore.getBackgroundFileCreateFlag();
    console.log('flag', flag);
    return flag ?? false;
  };

const setIsBackgroundFileCreationEnabled =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (isEnabled: boolean) => {
    settingStore.setBackgroundFileCreateFlag(isEnabled);
    console.log(
      'settingStore.getBackgroundFileCreateFlag()',
      settingStore.getBackgroundFileCreateFlag(),
    );
  };

export const backgroundSettingsRouter = (
  settingStore: ReturnType<typeof getSettingStore>,
) =>
  trpcRouter({
    getIsBackgroundFileCreationEnabled: procedure.query(async () => {
      const result = await getIsBackgroundFileCreationEnabled(settingStore)();
      return result;
    }),
    setIsBackgroundFileCreationEnabled: procedure
      .input(z.boolean())
      .mutation(async (ctx) => {
        await setIsBackgroundFileCreationEnabled(settingStore)(ctx.input);
      }),
  });
