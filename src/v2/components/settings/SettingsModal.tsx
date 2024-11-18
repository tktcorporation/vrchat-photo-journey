import React, { memo, useState } from 'react';
import { X, Settings as SettingsIcon, Sun, FolderOpen, Globe2 } from 'lucide-react';
import { useI18n } from '../../i18n/store';
import ThemeSelector from './ThemeSelector';
import AppInfo from './AppInfo';
import DependencyList from './DependencyList';
import LicenseInfo from './LicenseInfo';
import PathSettings from './PathSettings';
import LanguageSelector from '../LanguageSelector';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'paths' | 'theme' | 'language' | 'info';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const SettingsModal = memo(({ onClose }: SettingsModalProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('paths');

  const tabs: TabConfig[] = [
    { 
      id: 'paths', 
      label: t('settings.tabs.dataSource'), 
      icon: FolderOpen,
      component: PathSettings
    },
    { 
      id: 'theme', 
      label: t('settings.tabs.theme'), 
      icon: Sun,
      component: ThemeSelector
    },
    {
      id: 'language',
      label: 'Language / 言語',
      icon: Globe2,
      component: LanguageSelector
    },
    { 
      id: 'info', 
      label: t('settings.tabs.info'), 
      icon: SettingsIcon,
      component: () => (
        <div className="space-y-8">
          <AppInfo />
          <DependencyList />
          <LicenseInfo />
        </div>
      )
    }
  ];

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || tabs[0].component;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="h-[90vh] w-full max-w-2xl flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl"
        onClick={handleContentClick}
      >
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('common.settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-none border-b border-gray-200 dark:border-gray-700">
          <nav className="flex px-6" aria-label="Tabs">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative py-4 px-1 flex items-center text-sm font-medium ${
                  activeTab === id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                } mr-8`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ActiveComponent />
        </div>

        <div className="flex-none px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Photo Gallery. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;