import { app } from 'electron';
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

const getIsAppAutoStartEnabled = async (): Promise<boolean> => {
  const loginItemSettings = app.getLoginItemSettings();
  console.log('loginItemSettings', loginItemSettings);
  return loginItemSettings.openAtLogin;
};

const setIsAppAutoStartEnabled = async (isEnabled: boolean) => {
  console.log('setIsAppAutoStartEnabled: before', app.getLoginItemSettings());

  // macOSの場合、openAsHiddenをtrueに設定することで、バックグラウンドで起動するように
  app.setLoginItemSettings({
    openAtLogin: isEnabled,
    openAsHidden: true,
  });

  // 設定が反映されるまで少し待つ
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 設定が反映されたか確認
  const newSettings = app.getLoginItemSettings();
  console.log('setIsAppAutoStartEnabled: after', newSettings);

  if (newSettings.openAtLogin !== isEnabled) {
    console.error('Failed to update login item settings', {
      expected: isEnabled,
      actual: newSettings,
    });
    throw new Error('Failed to update login item settings');
  }

  return true;
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
    getIsAppAutoStartEnabled: procedure.query(async () => {
      const result = await getIsAppAutoStartEnabled();
      return result;
    }),
    setIsAppAutoStartEnabled: procedure
      .input(z.boolean())
      .mutation(async (ctx) => {
        const result = await setIsAppAutoStartEnabled(ctx.input);
        return result;
      }),
  });
