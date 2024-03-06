import { getSettingStore } from './settingStore';

const getIsEnabledBackgroundProcess =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    const backgroundFileCreateFlag = settingStore.getBackgroundFileCreateFlag();

    if (backgroundFileCreateFlag === null) {
      return false;
    }
    return backgroundFileCreateFlag;
  };

const getBackgroundUsecase = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  return {
    getIsEnabledBackgroundProcess: getIsEnabledBackgroundProcess(settingStore),
  };
};

export { getBackgroundUsecase };
