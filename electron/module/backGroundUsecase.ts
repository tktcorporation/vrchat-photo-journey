import { getSettingStore } from './settingStore';

const getIsEnabledBackgroundProcess =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    const backgroundFileCreateFlag = settingStore.getBackgroundFileCreateFlag();
    console.log('backgroundFileCreateFlag', backgroundFileCreateFlag);

    // TODO: 本来は設定画面で設定できるようにする
    return true;
    // if (backgroundFileCreateFlag === null) {
    //   return false;
    // }
    // return backgroundFileCreateFlag;
  };

const getBackgroundUsecase = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  return {
    getIsEnabledBackgroundProcess: getIsEnabledBackgroundProcess(settingStore),
  };
};

export { getBackgroundUsecase };
