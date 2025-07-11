import { trpcReact } from '@/trpc';
import { memo } from 'react';
import { useCombinedLoading } from '../../hooks/useCombinedLoading';
import { useTrpcMutationWithToast } from '../../hooks/useTrpcMutationWithToast';
import { useI18n } from '../../i18n/store';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ checked, onCheckedChange, disabled }: ToggleProps) => (
  <button
    type="button"
    onClick={() => onCheckedChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
      checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    role="switch"
    aria-checked={checked}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/**
 * 自動起動やバックグラウンド処理の設定を行う画面。
 * SettingsModal 内のシステムタブから利用される。
 */
const SystemSettings = memo(() => {
  const { t } = useI18n();
  const utils = trpcReact.useContext();

  const { data: startupLaunch, isLoading: isStartupLoading } =
    trpcReact.backgroundSettings.getIsAppAutoStartEnabled.useQuery();

  const { mutate: setStartupLaunch, isLoading: isStartupUpdating } =
    useTrpcMutationWithToast(
      trpcReact.backgroundSettings.setIsAppAutoStartEnabled,
      {
        successTitle: t('settings.system.startupLaunch'),
        errorTitle: t('settings.system.startupError'),
        onError: (err) => {
          console.error('Failed to update startup launch setting:', err);
        },
        onSuccess: () => {
          utils.backgroundSettings.getIsAppAutoStartEnabled.invalidate();
        },
      },
    );

  const { data: backgroundUpdate } =
    trpcReact.backgroundSettings.getIsBackgroundFileCreationEnabled.useQuery();

  const { mutate: setBackgroundUpdate } = useTrpcMutationWithToast(
    trpcReact.backgroundSettings.setIsBackgroundFileCreationEnabled,
    {
      onSuccess: () => {
        utils.backgroundSettings.getIsBackgroundFileCreationEnabled.invalidate();
      },
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('settings.system.title')}
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {t('settings.system.startupLaunch')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.system.startupDescription')}
            </div>
          </div>
          <Toggle
            checked={startupLaunch ?? false}
            onCheckedChange={setStartupLaunch}
            disabled={useCombinedLoading(isStartupLoading, isStartupUpdating)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {t('settings.system.backgroundUpdate')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.system.backgroundDescription')}
            </div>
          </div>
          <Toggle
            checked={backgroundUpdate ?? false}
            onCheckedChange={setBackgroundUpdate}
          />
        </div>
      </div>
    </div>
  );
});

SystemSettings.displayName = 'SystemSettings';

export default SystemSettings;
