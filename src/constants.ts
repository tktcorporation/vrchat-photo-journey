const ROUTER_PATHS = {
  ONBORDING: '/onboarding',
  CREATE_JOIN_INFO: '/',
  PHOTO_LIST: '/photo-list',
  SETTING: '/setting',
  SETTING_VRCHAT_LOG_PATH: '/setting/vrchat-log-path',
  SETTING_VRCHAT_PHOTO_PATH: '/setting/vrchat-photo-path',
  CLEAR_SETTINGS: '/clear-settings',
  CREATED_RESULT: '/created-result',
} as const;
type ROUTER_PATHS = (typeof ROUTER_PATHS)[keyof typeof ROUTER_PATHS];
type KeyOfRouterPaths = keyof typeof ROUTER_PATHS;

const routerPathValues = Object.values(ROUTER_PATHS);

const getRoutePathKeyByValue = (value: ROUTER_PATHS): KeyOfRouterPaths => {
  return Object.keys(ROUTER_PATHS).find(
    (key) => ROUTER_PATHS[key as KeyOfRouterPaths] === value,
  ) as KeyOfRouterPaths;
};

export { ROUTER_PATHS, getRoutePathKeyByValue, routerPathValues };
