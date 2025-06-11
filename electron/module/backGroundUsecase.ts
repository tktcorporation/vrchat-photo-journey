import type { getSettingStore } from './settingStore';

/**
 * 設定ストアからバックグラウンド処理の有効可否を取得する
 * Electron 起動時や終了時判定で利用される
 */
const getIsEnabledBackgroundProcess =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    const backgroundFileCreateFlag = settingStore.getBackgroundFileCreateFlag();

    if (backgroundFileCreateFlag === null) {
      return false;
    }
    return backgroundFileCreateFlag;
  };

/**
 * バックグラウンド関連のユースケースオブジェクトを生成する
 * index.ts から参照される
 */
const getBackgroundUsecase = (
  settingStore: ReturnType<typeof getSettingStore>,
) => {
  return {
    getIsEnabledBackgroundProcess: getIsEnabledBackgroundProcess(settingStore),
  };
};

export { getBackgroundUsecase };
