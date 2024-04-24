export const ROUTER_PATHS = {
  HOME: '/',
  SETTING: '/setting',
  SETTING_ABOUT_APP: '/setting/about-app',
  SETTING_ABOUT_APP_LICENSE: '/setting/about-app/license',
  SETTING_VRCHAT_LOG_PATH: '/setting/vrchat-log-path',
  SETTING_BACKGROUND_EXECUTION: '/setting/background-execution',
  SETTING_DEV_DEBUG: '/setting/dev-debug',
  CLEAR_SETTINGS: '/clear-settings',
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
