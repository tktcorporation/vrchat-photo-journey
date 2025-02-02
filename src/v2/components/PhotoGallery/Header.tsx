import { invalidatePhotoGalleryQueries } from '@/queryClient';
import { trpcReact } from '@/trpc';
import { Eye, EyeOff, RefreshCw, Settings } from 'lucide-react';
import { memo, useState } from 'react';
import { useI18n } from '../../i18n/store';
import SearchBar from '../SearchBar';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  showEmptyGroups: boolean;
  onToggleEmptyGroups: () => void;
}

const Header = memo(
  ({
    setSearchQuery,
    onOpenSettings,
    showEmptyGroups,
    onToggleEmptyGroups,
  }: HeaderProps) => {
    const { t } = useI18n();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const utils = trpcReact.useUtils();
    const { mutate: loadLogInfo } =
      trpcReact.logInfo.loadLogInfoIndex.useMutation({
        onSuccess: () => {
          invalidatePhotoGalleryQueries(utils);
        },
        onSettled: () => {
          setIsRefreshing(false);
        },
      });

    const handleRefresh = async () => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        loadLogInfo({ excludeOldLogLoad: true });
      }
    };

    return (
      <header className="flex-none bg-white dark:bg-gray-800 shadow-sm z-50 sticky top-0">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center py-2">
            <div className="flex items-center gap-2">
              <SearchBar onSearch={setSearchQuery} />
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                aria-label={t('common.refresh')}
                title={t('common.refresh')}
              >
                <RefreshCw
                  className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('common.settings')}
              >
                <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 py-2">
            <button
              type="button"
              onClick={onToggleEmptyGroups}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {!showEmptyGroups ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>
                {!showEmptyGroups
                  ? t('common.hidingEmptyGroups')
                  : t('common.showingEmptyGroups')}
              </span>
            </button>
          </div>
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
