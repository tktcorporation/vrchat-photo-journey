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

/**
 * PhotoGallery のヘッダーコンポーネント
 *
 * リフレッシュ処理の重要な点：
 * 1. VRChat のログファイル更新と処理は特定の順序で行う必要があります
 * 2. この順序を変更すると、新しいワールド情報が正しく反映されなくなります
 */
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

    /**
     * VRChatログファイルから新しいログ行を読み込むミューテーション
     *
     * このステップは非常に重要です：
     * - VRChatのログファイル（output_log.txt）から関連するログ行を抽出します
     * - 抽出したログ行はアプリ内のログストアファイル（logStore-YYYY-MM.txt）に保存されます
     * - このプロセスがなければ、新しいワールド参加ログが検出されません
     *
     * 成功した場合のみ次のステップ（loadLogInfo）が実行されます
     */
    const { mutate: appendLoglines } =
      trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation({
        onSuccess: () => {
          loadLogInfo({ excludeOldLogLoad: true });
        },
        onError: (error) => {
          console.error('Failed to append log lines:', error);
          setIsRefreshing(false);
        },
      });

    /**
     * 保存されたログからデータベースにログ情報をロードするミューテーション
     *
     * このステップは appendLoglines の後に実行する必要があります：
     * - 保存されたログストアファイルからログ情報をロードします
     * - ログ情報をパースしてワールド参加、プレイヤー参加、プレイヤー退出などの情報を抽出します
     * - 抽出した情報をデータベースに保存します
     * - excludeOldLogLoad: true を指定すると、最新のログのみが処理されます
     *
     * 成功するとキャッシュが無効化され、UIが更新されます
     */
    const { mutate: loadLogInfo } =
      trpcReact.logInfo.loadLogInfoIndex.useMutation({
        onSuccess: () => {
          // クエリキャッシュを無効化して、最新のデータでUIを更新
          invalidatePhotoGalleryQueries(utils);
        },
        onSettled: () => {
          setIsRefreshing(false);
        },
      });

    /**
     * リフレッシュボタンがクリックされたときの処理
     *
     * 重要な処理順序：
     * 1. appendLoglines(): VRChatログファイルから新しいログ行を読み込む
     * 2. その成功後に loadLogInfo(): ログ情報をDBに保存
     * 3. その成功後に invalidatePhotoGalleryQueries(): UIを更新
     *
     * この順序が重要な理由：
     * - 1→2→3の順で処理しないと、新しいワールド参加ログがDBに保存されず、
     *   新しい写真が古いワールドグループに誤って割り当てられます
     * - アプリ再起動時は全プロセスが順番に実行されますが、リフレッシュ時には
     *   明示的にこの順序で処理を行う必要があります
     */
    const handleRefresh = async () => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        // 先に VRChat ログファイルを処理
        appendLoglines();
      }
    };

    return (
      <header className="flex-none bg-[hsl(var(--gradient-start))] dark:bg-[hsl(var(--gradient-start))] shadow-sm z-50 sticky top-0">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 dark:border-gray-700">
              <button
                type="button"
                onClick={onToggleEmptyGroups}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
