import React, { memo } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import SearchBar from '../SearchBar';
import { useCurrentGroup } from './useCurrentGroup';
import { useI18n } from '../../i18n/store';
import { usePhotoSource } from '../../hooks/usePhotoSource';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  groupCount: number;
}

const Header = memo(({ 
  searchQuery, 
  setSearchQuery, 
  onOpenSettings,
  groupCount
}: HeaderProps) => {
  const { t } = useI18n();
  const { currentGroup } = useCurrentGroup();
  const { refreshPhotos, isRefreshing } = usePhotoSource();

  const handleRefresh = async () => {
    if (!isRefreshing) {
      await refreshPhotos();
    }
  };

  return (
    <header className="flex-none bg-white dark:bg-gray-800 shadow-sm z-50 sticky top-0">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('common.photoGallery')}
          </h1>
          <div className="flex items-center gap-4">
            <SearchBar onSearch={setSearchQuery} />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              aria-label={t('common.refresh')}
              title={t('common.refresh')}
            >
              <RefreshCw 
                className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('common.settings')}
            >
              <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;