import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, Search, Settings, X } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { UseLoadingStateResult } from '../../hooks/useLoadingState';
import { LOG_SYNC_MODE, useLogSync } from '../../hooks/useLogSync';
import { useI18n } from '../../i18n/store';
// import DarkModeToggle from '../settings/DarkModeToggle'; // ★ コメントアウト

interface HeaderProps
  extends Pick<
    UseLoadingStateResult,
    'isRefreshing' | 'startRefreshing' | 'finishRefreshing'
  > {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  selectedPhotoCount: number;
  onClearSelection: () => void;
  isMultiSelectMode: boolean;
  onCopySelected?: () => void;
}

/**
 * PhotoGallery のヘッダーコンポーネント
 *
 * リフレッシュ処理の重要な点：
 * 1. VRChat のログファイル更新と処理は特定の順序で行う必要があります
 * 2. この順序を変更すると、新しいワールド情報が正しく反映されなくなります
 */
const Header = memo(
  ({
    searchQuery,
    setSearchQuery,
    onOpenSettings,
    selectedPhotoCount,
    onClearSelection,
    isMultiSelectMode,
    onCopySelected,
    isRefreshing,
    startRefreshing,
    finishRefreshing,
  }: HeaderProps) => {
    const { t } = useI18n();

    // ログ同期フックを使用
    const { sync: syncLogs, isLoading: isSyncing } = useLogSync({
      onSuccess: () => {
        // 同期完了時の処理
        finishRefreshing();
      },
      onError: (error) => {
        console.error('Failed to sync logs:', error);
        finishRefreshing();
      },
    });

    /**
     * リフレッシュボタンがクリックされたときの処理
     *
     * 統一されたログ同期処理：
     * 1. appendLoglines: VRChatログファイルから新しいログ行を読み込む
     * 2. loadLogInfo: ログ情報をDBに保存
     * 3. キャッシュの無効化: UIを更新
     *
     * この順序が自動的に保証されます
     */
    const handleRefresh = async () => {
      if (isRefreshing || isSyncing) {
        return;
      }
      startRefreshing();
      // 差分処理モードでログを同期
      await syncLogs(LOG_SYNC_MODE.INCREMENTAL);
    };

    return (
      <header className="flex items-center justify-between p-2 border-b dark:border-gray-700 space-x-2 sticky top-0 bg-background z-10">
        {/* 複数選択モードの表示 */}
        {isMultiSelectMode ? (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onClearSelection}>
              <X className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium">
              {`${selectedPhotoCount} 件選択中`}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCopySelected}
                title={
                  selectedPhotoCount > 1
                    ? `${selectedPhotoCount}枚の写真をコピー`
                    : t('common.contextMenu.copyPhotoData')
                }
                disabled={!onCopySelected}
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          // 通常モードの表示 (左側)
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || isSyncing}
              title={t('common.refresh')}
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
            {/* 必要であれば他の要素 */}
          </div>
        )}

        {/* 中央: 検索バー (常に表示) */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('common.search.placeholder')}
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
