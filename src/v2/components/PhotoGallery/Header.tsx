import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { invalidatePhotoGalleryQueries } from '@/queryClient';
import { trpcReact } from '@/trpc';
import {
  Copy,
  Eye,
  EyeOff,
  ListFilter,
  RefreshCw,
  Search,
  Settings,
  X,
} from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { UseLoadingStateResult } from '../../hooks/useLoadingState';
import { useI18n } from '../../i18n/store';
import SearchBar from '../SearchBar';
// import DarkModeToggle from '../settings/DarkModeToggle'; // ★ コメントアウト

interface HeaderProps
  extends Pick<
    UseLoadingStateResult,
    'isRefreshing' | 'startRefreshing' | 'finishRefreshing'
  > {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  showEmptyGroups: boolean;
  onToggleEmptyGroups: () => void;
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
    showEmptyGroups,
    onToggleEmptyGroups,
    selectedPhotoCount,
    onClearSelection,
    isMultiSelectMode,
    onCopySelected,
    isRefreshing,
    startRefreshing,
    finishRefreshing,
  }: HeaderProps) => {
    const { t } = useI18n();
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
          finishRefreshing();
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
          finishRefreshing();
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
    const _handleRefresh = async () => {
      if (isRefreshing) {
        return;
      }
      startRefreshing();
      // 先に VRChat ログファイルを処理
      appendLoglines();
      // その後ログ情報をロード
      loadLogInfo({ excludeOldLogLoad: true });
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
              onClick={_handleRefresh}
              disabled={isRefreshing}
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

        {/* 右側: フィルターとダークモードトグル (常に表示) */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Select
            value={showEmptyGroups ? 'show' : 'hide'}
            onValueChange={(value: string) => {
              if (
                (value === 'show' && !showEmptyGroups) ||
                (value === 'hide' && showEmptyGroups)
              ) {
                onToggleEmptyGroups();
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <ListFilter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('common.settings')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">
                {t('common.showingEmptyGroups')}
              </SelectItem>
              <SelectItem value="hide">
                {t('common.hidingEmptyGroups')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6" />
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
