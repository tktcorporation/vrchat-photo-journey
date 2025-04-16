import { trpcReact } from '@/trpc';
import { format } from 'date-fns';
import {
  Calendar,
  CheckIcon,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Laptop,
  LoaderCircle,
  Share2,
  Users,
  X,
} from 'lucide-react';
import React, { memo, useRef, useState, useEffect } from 'react';
import type { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { BoldPreviewSvg } from '../components/BoldPreview';
import { useI18n } from '../i18n/store';
import { generatePreviewPng } from '../utils/previewGenerator';
import { downloadOrCopyImageAsPng } from '../utils/shareUtils';

/**
 * LocationGroupHeaderのプロパティ定義
 * @param worldId - ワールドのID
 * @param worldName - ワールドの名前
 * @param worldInstanceId - ワールドインスタンスのID
 * @param photoCount - 写真の枚数
 * @param joinDateTime - ワールドに参加した日時
 */
interface LocationGroupHeaderProps {
  worldId: string | null;
  worldName: string | null;
  worldInstanceId: string | null;
  photoCount: number;
  joinDateTime: Date;
}

interface Player {
  id: string;
  playerId: string | null;
  playerName: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

// プラットフォームのアイコンを表示するコンポーネント
const PlatformBadge = memo(({ platform }: { platform: string }) => {
  const platformName =
    platform === 'standalonewindows'
      ? 'PC'
      : platform === 'android'
        ? 'Quest'
        : platform;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      <Laptop className="h-3 w-3 mr-1" />
      {platformName}
    </span>
  );
});

PlatformBadge.displayName = 'PlatformBadge';

// プレイヤーリストを表示するコンポーネント
const PlayerList = memo(
  ({
    players,
    maxVisiblePlayers,
  }: { players: Player[]; maxVisiblePlayers: number }) => {
    const visiblePlayers = players.slice(
      0,
      players.length <= maxVisiblePlayers ? players.length : maxVisiblePlayers,
    );
    const remainingCount = players.length - maxVisiblePlayers;
    const showMoreCount = players.length > maxVisiblePlayers;

    return (
      <>
        {visiblePlayers.map((p: Player, index) => (
          <React.Fragment key={p.id}>
            <span className="opacity-90">{p.playerName}</span>
            {index < visiblePlayers.length - 1 && (
              <span className="opacity-50">/</span>
            )}
          </React.Fragment>
        ))}
        {showMoreCount && (
          <>
            <span className="opacity-50">/</span>
            <span className="opacity-75">+{remainingCount}</span>
          </>
        )}
      </>
    );
  },
);

PlayerList.displayName = 'PlayerList';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldName: string | null;
  worldId: string;
  joinDateTime: Date;
  imageUrl: string | null;
  players: Player[] | null;
}

const ShareModal = ({
  isOpen,
  onClose,
  worldName,
  worldId,
  joinDateTime,
  imageUrl,
  players,
}: ShareModalProps) => {
  const { t } = useI18n();
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // 画像のBase64変換をバックエンドに依頼
  const { data: base64Data, isLoading } =
    trpcReact.vrchatApi.convertImageToBase64.useQuery(imageUrl || '', {
      enabled: !!imageUrl && isOpen,
      staleTime: 1000 * 60 * 5, // 5分間キャッシュ
      cacheTime: 1000 * 60 * 30, // 30分間キャッシュを保持
    });

  const copyImageMutation =
    trpcReact.electronUtil.copyImageDataByBase64.useMutation();
  const downloadImageMutation =
    trpcReact.electronUtil.downloadImageAsPhotoLogPng.useMutation();

  // プレビュー画像を生成する関数
  const generatePreview = async () => {
    if (!base64Data || !worldName) return;
    setIsGeneratingPreview(true);
    try {
      const pngBase64 = await generatePreviewPng({
        worldName,
        imageBase64: base64Data,
        players,
        showAllPlayers,
      });
      setPreviewBase64(pngBase64);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // base64Dataが変更されたら、プレビューを生成
  useEffect(() => {
    if (base64Data) {
      generatePreview();
    }
  }, [base64Data, worldName, players, showAllPlayers]);

  const handleCopyShareImageToClipboard = async () => {
    if (!previewBase64) return;
    await downloadOrCopyImageAsPng({
      pngBase64: previewBase64,
      filenameWithoutExt: worldName || 'image',
      downloadOrCopyMutation: {
        mutateAsync: async (params) => {
          await copyImageMutation.mutateAsync(params);
          return undefined;
        },
      },
    });
  };

  const handleDownloadShareImagePng = async () => {
    if (!previewBase64) return;
    await downloadImageMutation.mutateAsync({
      worldId,
      joinDateTime,
      imageBase64: previewBase64,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[70vh] flex flex-col p-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/30 shadow-2xl">
        <DialogHeader className="px-6 pt-4 pb-2 border-b border-white/10 dark:border-gray-700/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('locationHeader.share')}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareImageToClipboard}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/20 dark:bg-gray-800/50 hover:bg-white/30 dark:hover:bg-gray-800/60 border border-white/10 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('locationHeader.copyToClipboard')}
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleDownloadShareImagePng}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/20 dark:bg-gray-800/50 hover:bg-white/30 dark:hover:bg-gray-800/60 border border-white/10 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('locationHeader.downloadImage')}
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="flex flex-col pb-6 px-6 h-[calc(100vh-130px)] items-center justify-center">
          <div className="h-full aspect-[4/3] overflow-y-auto border border-white/10 dark:border-gray-700/20 rounded-lg">
            <ContextMenu>
              <ContextMenuTrigger className="w-full">
                <div className="h-full rounded-lg overflow-y-auto">
                  <div className="w-full">
                    {isLoading || isGeneratingPreview ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {previewBase64 && (
                          <img
                            src={`data:image/png;base64,${previewBase64}`}
                            alt={worldName || 'Preview'}
                            className="h-96	 max-h-full w-auto"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-lg">
                <ContextMenuItem
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/60 dark:focus:bg-gray-800/60 flex items-center gap-2"
                  onClick={handleCopyShareImageToClipboard}
                  disabled={isLoading}
                >
                  <Copy className="h-4 w-4" />
                  <span>{t('locationHeader.copyToClipboard')}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50 focus:bg-white/60 dark:focus:bg-gray-800/60 flex items-center gap-2"
                  onClick={handleDownloadShareImagePng}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  <span>{t('locationHeader.downloadImage')}</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-white/10 dark:border-gray-700/20">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-players"
              className="data-[state=checked]:bg-primary-500/90 data-[state=unchecked]:bg-white/20 dark:data-[state=unchecked]:bg-gray-800/50"
              checked={showAllPlayers}
              onCheckedChange={setShowAllPlayers}
            />
            <Label
              htmlFor="show-all-players"
              className="text-sm text-gray-800 dark:text-gray-200 cursor-pointer"
            >
              {t('locationHeader.showAllPlayers')}
            </Label>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const LocationGroupHeader = ({
  worldId,
  worldName,
  worldInstanceId,
  photoCount,
  joinDateTime,
}: LocationGroupHeaderProps) => {
  const { t } = useI18n();
  const openUrlMutation =
    trpcReact.electronUtil.openUrlInDefaultBrowser.useMutation();
  const copyTextMutation =
    trpcReact.electronUtil.copyTextToClipboard.useMutation();

  // State
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isImageLoaded, _setIsImageLoaded] = useState(false);
  const [shouldLoadDetails, setShouldLoadDetails] = useState(false);
  const [maxVisiblePlayers, setMaxVisiblePlayers] = useState(6);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Refs
  const playerListRef = useRef<HTMLSpanElement>(null);
  const playerListContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Data fetching
  const { data: details } =
    trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId ?? '', {
      enabled: worldId !== null && shouldLoadDetails,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    });

  const { data: playersResult, isLoading: isPlayersLoading } =
    trpcReact.logInfo.getPlayerListInSameWorld.useQuery(joinDateTime, {
      enabled: worldId !== null && shouldLoadDetails,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    });

  // Derived state
  const formattedDate = format(joinDateTime, 'yyyy年MM月dd日 HH:mm');
  const players = Array.isArray(playersResult) ? playersResult : null;

  // ワールドリンク
  const worldLink = worldInstanceId
    ? `https://vrchat.com/home/world/${worldId}?instanceId=${worldInstanceId}`
    : `https://vrchat.com/home/world/${worldId}/info`;

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({
      top: event.clientY + 16,
      left: event.clientX,
    });
  };

  const handleCopyPlayers = () => {
    if (!players) return;

    const playerNames = players.map((p) => p.playerName).join('\n');
    copyTextMutation.mutate(playerNames);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Effects
  useEffect(() => {
    const calculateMaxVisiblePlayers = () => {
      if (!playerListContainerRef.current || !Array.isArray(players)) return;

      const containerWidth = playerListContainerRef.current.offsetWidth;
      const separatorWidth = 24; // セパレータ（ / ）の幅
      const moreTextWidth = 48; // "/ +X" テキストの幅

      // 一時的なDOM要素を作成して実際の幅を計算
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'nowrap';
      tempDiv.style.fontSize = '0.875rem'; // text-sm
      document.body.appendChild(tempDiv);

      let totalWidth = 0;
      let maxPlayers = 0;

      for (let i = 0; i < players.length; i++) {
        tempDiv.textContent = players[i].playerName;
        const playerNameWidth = tempDiv.getBoundingClientRect().width;
        const widthWithSeparator =
          playerNameWidth + (i < players.length - 1 ? separatorWidth : 0);

        if (
          totalWidth +
            widthWithSeparator +
            (i < players.length - 1 ? moreTextWidth : 0) >
          containerWidth
        ) {
          break;
        }

        totalWidth += widthWithSeparator;
        maxPlayers = i + 1;
      }

      document.body.removeChild(tempDiv);
      setMaxVisiblePlayers(Math.max(3, maxPlayers)); // 最低3人は表示
    };

    // 初回計算
    calculateMaxVisiblePlayers();

    // ResizeObserverを使用してコンテナのサイズ変更を監視
    const resizeObserver = new ResizeObserver(calculateMaxVisiblePlayers);
    if (playerListContainerRef.current) {
      resizeObserver.observe(playerListContainerRef.current);
    }

    // ウィンドウリサイズ時も再計算
    window.addEventListener('resize', calculateMaxVisiblePlayers);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateMaxVisiblePlayers);
    };
  }, [players]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          visibilityTimeoutRef.current = setTimeout(() => {
            setShouldLoadDetails(true);
          }, 100);
        } else {
          setIsVisible(false);
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
          }
        }
      },
      {
        rootMargin: '100px',
        threshold: 0,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateTooltipPosition = () => {
      if (playerListRef.current) {
        const rect = playerListRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    };

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition);
    };
  }, []);

  if (worldId === null) {
    return (
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-t-xl shadow-lg p-6">
        <div className="flex items-center gap-x-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {t('locationHeader.ungrouped')}
          </h2>
          <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {photoCount}
            </span>
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <time dateTime={joinDateTime.toISOString()}>{formattedDate}</time>
        </div>
      </header>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-gray-800 rounded-t-lg shadow-lg overflow-hidden transition-all duration-500 group/card"
    >
      <div className="relative h-24 overflow-hidden flex items-center justify-center">
        <div
          className={`absolute inset-0 ${
            !isImageLoaded || !details?.thumbnailImageUrl
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-800 dark:to-gray-900'
              : ''
          }`}
        >
          {details?.thumbnailImageUrl && isVisible && (
            <>
              <div
                className="absolute inset-0 scale-110 transition-transform duration-700"
                style={{
                  backgroundImage: `url(${details.thumbnailImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(26px) saturate(120%) brightness(0.9)',
                }}
              />
              <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/50 backdrop-blur-[1px] group-hover/card:backdrop-blur-[2px] transition-all duration-500" />
              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90" /> */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-900/30 dark:to-gray-900/10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),rgba(255,255,255,0.2)_70%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(17,24,39,0.4),rgba(17,24,39,0.2)_70%)]" />
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-2">
          {/* 左側に画像、右側に情報 */}
          <div className="flex items-center gap-4 w-full">
            {/* 左側 - ワールド画像 */}
            <div className="flex-shrink-0">
              {details?.thumbnailImageUrl ? (
                <div
                  className="h-20 rounded-lg overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-md"
                  style={{ aspectRatio: '4/3' }}
                >
                  <img
                    src={details.thumbnailImageUrl}
                    alt={details?.name || worldName || 'World'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className="h-20 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center border border-white/20 dark:border-gray-700/30"
                  style={{ aspectRatio: '4/3' }}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                </div>
              )}
            </div>

            {/* 右側 - 情報 */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* 1行目: ワールド名とアクション */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center group/title text-gray-800 dark:text-white">
                  <button
                    type="button"
                    className="hover:underline flex items-center transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUrlMutation.mutate(worldLink);
                    }}
                  >
                    <span className="line-clamp-1 text-start">
                      {details?.name || worldName}
                    </span>
                    <ExternalLink className="h-4 w-4 ml-2 transition-opacity flex-shrink-0" />
                  </button>
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center text-sm text-gray-800 dark:text-white backdrop-blur-sm bg-white/30 dark:bg-black/30 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700/30">
                    <Calendar className="h-4 w-4 mr-1.5 text-primary-600 dark:text-primary-300" />
                    {formattedDate}
                  </div>
                  {details?.unityPackages &&
                    details.unityPackages.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {Array.from(
                          new Set(
                            details.unityPackages.map((pkg) => pkg.platform),
                          ),
                        ).map((platform) => (
                          <PlatformBadge key={platform} platform={platform} />
                        ))}
                      </div>
                    )}
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center text-sm font-medium text-gray-800 dark:text-white backdrop-blur-sm bg-primary-500/10 hover:bg-primary-500/20 dark:bg-primary-500/30 dark:hover:bg-primary-500/40 px-3 py-1 rounded-full transition-all duration-300 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20"
                  >
                    <Share2 className="h-4 w-4 mr-1.5" />
                  </button>
                </div>
              </div>

              {/* 2行目: 写真枚数とプレイヤーリスト */}
              <div className="flex items-center gap-2 w-full">
                {/* <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center text-xs text-gray-800 dark:text-white backdrop-blur-sm bg-white/30 dark:bg-black/30 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700/30">
                    <ImageIcon className="h-4 w-4 mr-1.5 text-primary-600 dark:text-primary-300" />
                    {photoCount}
                  </div>
                  {worldError && (
                    <span className="text-yellow-400 bg-yellow-500/10 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-500/20 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      {t('locationHeader.worldInfoDeleted')}
                    </span>
                  )}
                </div> */}

                {isPlayersLoading ? (
                  <div className="flex gap-2 items-center text-xs text-gray-800 dark:text-white backdrop-blur-sm bg-white/30 dark:bg-black/30 px-3 py-1 rounded-full border border-white/20 dark:border-gray-700/30 flex-1 min-w-0 animate-pulse">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary-600/50 dark:text-primary-300/50 flex-shrink-0" />
                      <div className="h-4 w-6 bg-gray-200/70 dark:bg-black/40 rounded" />
                    </div>
                    <div className="text-gray-500/50 dark:text-gray-400/50">
                      |
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-4 w-24 bg-gray-200/70 dark:bg-black/40 rounded" />
                      <div className="h-4 w-20 bg-gray-200/70 dark:bg-black/40 rounded" />
                      <div className="h-4 w-16 bg-gray-200/70 dark:bg-black/40 rounded" />
                    </div>
                  </div>
                ) : (
                  players &&
                  players.length > 0 && (
                    <div className="flex gap-2 items-center text-xs text-gray-800 dark:text-white backdrop-blur-sm bg-white/30 hover:bg-white/40 dark:bg-black/30 dark:hover:bg-black/40 px-3 py-1 rounded-full transition-all duration-300 border border-white/20 dark:border-gray-700/30 hover:border-white/30 dark:hover:border-gray-700/40 group/players flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary-600 dark:text-primary-300 flex-shrink-0" />
                        <span>{players.length}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">|</div>
                      <div
                        ref={playerListContainerRef}
                        className="relative cursor-pointer flex-1 min-w-0"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onMouseMove={handleMouseMove}
                        onClick={handleCopyPlayers}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCopyPlayers();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        title={t('locationHeader.clickToCopy')}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!isCopied ? (
                            <PlayerList
                              players={players}
                              maxVisiblePlayers={maxVisiblePlayers}
                            />
                          ) : (
                            <span className="text-green-400 flex items-center gap-2">
                              <CheckIcon className="h-4 w-4" />
                              {t('locationHeader.copied')}
                            </span>
                          )}
                        </div>
                        {players &&
                          (createPortal(
                            <div
                              style={{
                                position: 'fixed',
                                visibility: isHovered ? 'visible' : 'hidden',
                                opacity: isHovered ? 1 : 0,
                                transition: 'opacity 200ms',
                                top: tooltipPosition.top,
                                left: tooltipPosition.left,
                              }}
                              className="z-50 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-900 dark:text-gray-100 text-sm rounded-lg shadow-xl border border-gray-200/20 dark:border-gray-700/30"
                            >
                              <div className="flex flex-wrap gap-2">
                                {players.map((p: Player) => (
                                  <span
                                    key={p.id}
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50"
                                  >
                                    {p.playerName}
                                  </span>
                                ))}
                              </div>
                            </div>,
                            document.body,
                          ) as ReactPortal)}
                      </div>
                      <Copy className="h-4 w-4 ml-2 text-gray-800 dark:text-white group-hover/players:text-gray-200 transition-colors flex-shrink-0" />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        worldName={details?.name || worldName}
        worldId={worldId}
        joinDateTime={joinDateTime}
        imageUrl={details?.imageUrl || null}
        players={players}
      />
    </div>
  );
};

export default LocationGroupHeader;
