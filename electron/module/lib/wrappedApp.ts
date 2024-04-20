import { app } from 'electron';

/**
 * Get the path to the user data directory.
 * ex. C:\Users\username\AppData\Roaming\app-name
 */
export const getAppUserDataPath = () => {
  return app.getPath('userData');
};
