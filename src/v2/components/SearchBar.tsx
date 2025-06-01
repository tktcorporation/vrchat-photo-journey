import { Search } from 'lucide-react';
import React, { memo } from 'react';
import { useI18n } from '../i18n/store';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

/**
 * ギャラリー画面上部で写真を検索するテキスト入力欄。
 * 入力値は usePhotoGallery フックに渡されフィルタリングに使われる。
 */
const SearchBar = memo(({ onSearch }: SearchBarProps) => {
  const { t } = useI18n();

  return (
    <div className="relative w-full sm:w-64">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-8 pr-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder={t('common.search.placeholder')}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
