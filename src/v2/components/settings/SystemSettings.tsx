import { Power, RefreshCw } from 'lucide-react';
import React, { memo } from 'react';
import { useI18n } from '../../i18n/store';

const SystemSettings = memo(() => {
  const { t } = useI18n();
  const { settings, updateSettings } = {
    settings: {
      startupLaunch: true,
      backgroundUpdate: true,
      updateInterval: 5,
      showNotifications: true,
    },
    updateSettings: (_newSettings: typeof settings) => {
      // 実装は空のまま
    },
  };

  return (
    <section>
      <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-white mb-4">
        <Power className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
        {t('settings.system.title')}
      </h3>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('settings.system.startupLaunch')}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.system.startupDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                ...settings,
                startupLaunch: !settings.startupLaunch,
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              settings.startupLaunch
                ? 'bg-indigo-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={settings.startupLaunch}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.startupLaunch ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('settings.system.backgroundUpdate')}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.system.backgroundDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                ...settings,
                backgroundUpdate: !settings.backgroundUpdate,
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              settings.backgroundUpdate
                ? 'bg-indigo-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={settings.backgroundUpdate}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.backgroundUpdate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.backgroundUpdate && (
          <div className="pl-6 border-l-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('settings.system.updateInterval')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.system.updateIntervalDescription')}
                </p>
              </div>
              <select
                value={settings.updateInterval}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    updateInterval: Number(e.target.value),
                  })
                }
                className="block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value={5}>{t('settings.system.interval.5min')}</option>
                <option value={15}>
                  {t('settings.system.interval.15min')}
                </option>
                <option value={30}>
                  {t('settings.system.interval.30min')}
                </option>
                <option value={60}>
                  {t('settings.system.interval.1hour')}
                </option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('settings.system.notifications')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.system.notificationsDescription')}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    ...settings,
                    showNotifications: !settings.showNotifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  settings.showNotifications
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={settings.showNotifications}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.showNotifications
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

SystemSettings.displayName = 'SystemSettings';

export default SystemSettings;
