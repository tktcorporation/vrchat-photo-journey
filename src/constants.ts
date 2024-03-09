export const ROUTER_PATHS = {
  ONBORDING: '/onboarding',
  HOME: '/',
  PHOTO_LIST: '/photo-list',
  SETTING: '/setting',
  SETTING_VRCHAT_LOG_PATH: '/setting/vrchat-log-path',
  SETTING_VRCHAT_PHOTO_PATH: '/setting/vrchat-photo-path',
  SETTING_BACKGROUND_EXECUTION: '/setting/background-execution',
  CLEAR_SETTINGS: '/clear-settings',
  CREATED_RESULT: '/created-result',
} as const;
export type ROUTER_PATHS = (typeof ROUTER_PATHS)[keyof typeof ROUTER_PATHS];
type KeyOfRouterPaths = keyof typeof ROUTER_PATHS;

const routerPathValues = Object.values(ROUTER_PATHS);

const getRoutePathKeyByValue = (value: ROUTER_PATHS): KeyOfRouterPaths => {
  const keys = Object.keys(ROUTER_PATHS).find(
    (key) => ROUTER_PATHS[key as KeyOfRouterPaths] === value,
  );
  if (!keys) {
    throw new Error('Invalid route path');
  }
  return keys as KeyOfRouterPaths;
};

export { getRoutePathKeyByValue, routerPathValues };
