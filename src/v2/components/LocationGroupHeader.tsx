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
  MapPin,
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
import { copyImageToClipboard, downloadImageAsPng } from '../utils/shareUtils';

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
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
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
    if (players.length <= maxVisiblePlayers) {
      return (
        <>
          {players.map((p: Player, index) => (
            <React.Fragment key={p.id}>
              <span className="opacity-90">{p.playerName}</span>
              {index < players.length - 1 && (
                <span className="opacity-50">/</span>
              )}
            </React.Fragment>
          ))}
        </>
      );
    }

    return (
      <>
        {players.slice(0, maxVisiblePlayers).map((p: Player, index) => (
          <React.Fragment key={p.id}>
            <span className="opacity-90">{p.playerName}</span>
            {index < maxVisiblePlayers - 1 && (
              <span className="opacity-50">/</span>
            )}
          </React.Fragment>
        ))}
        <span className="opacity-75 ml-1">
          / +{players.length - maxVisiblePlayers} more
        </span>
      </>
    );
  },
);

PlayerList.displayName = 'PlayerList';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldName: string | null;
  imageUrl: string | null;
  players: Player[] | null;
}

const ShareModal = ({
  isOpen,
  onClose,
  worldName,
  imageUrl,
  players,
}: ShareModalProps) => {
  const { t } = useI18n();
  const previewRef = useRef<SVGSVGElement>(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // 画像のBase64変換をバックエンドに依頼
  const { data: base64Data, isLoading } =
    trpcReact.vrchatApi.convertImageToBase64.useQuery(imageUrl || '', {
      enabled: !!imageUrl && isOpen,
      staleTime: 1000 * 60 * 5, // 5分間キャッシュ
      cacheTime: 1000 * 60 * 30, // 30分間キャッシュを保持
    });

  const copyImageMutation =
    trpcReact.electronUtil.copyImageDataByBase64.useMutation();

  const handleCopyToClipboard = async () => {
    if (!previewRef.current) return;
    const filename = worldName ? `${worldName}.png` : 'image.png';
    await copyImageToClipboard(
      previewRef.current,
      (svgData) => copyImageMutation.mutate({ svgData, filename }),
      filename,
    );
  };

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    await downloadImageAsPng({
      svgElement: previewRef.current,
      worldName,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-800 border-none">
        <DialogHeader className="px-6 pt-4 pb-2 border-gray-200 dark:border-gray-700 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('locationHeader.share')}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title={t('locationHeader.copyToClipboard')}
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title={t('locationHeader.downloadImage')}
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="flex flex-col pb-6 px-6 h-[calc(100vh-130px)] items-center justify-center">
          <div className="h-full aspect-[4/3] overflow-y-auto">
            <ContextMenu>
              <ContextMenuTrigger className="w-full">
                <div className="h-full rounded-lg overflow-y-auto">
                  <div className="w-full">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <BoldPreviewSvg
                          worldName={worldName}
                          imageBase64={base64Data}
                          players={players}
                          previewRef={previewRef}
                          showAllPlayers={showAllPlayers}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={handleCopyToClipboard}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{t('locationHeader.copyToClipboard')}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={handleDownloadPng}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('locationHeader.downloadImage')}</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
        <DialogFooter className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-players"
              checked={showAllPlayers}
              onCheckedChange={setShowAllPlayers}
            />
            <Label
              htmlFor="show-all-players"
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
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
  const { data: details, error: worldError } =
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
      const separatorWidth = 16; // セパレータ（ / ）の幅
      const moreTextWidth = 60; // "+X more" テキストの幅

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
      <header className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-x-2">
          <h2 className="text-lg font-bold">{t('locationHeader.ungrouped')}</h2>
          <span className="text-sm text-gray-500">
            <ImageIcon className="h-4 w-4" />
            <span>{photoCount}</span>
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          <time dateTime={joinDateTime.toISOString()}>{formattedDate}</time>
        </div>
      </header>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="relative h-36 overflow-hidden group">
        <div
          className={`absolute inset-0 ${
            !isImageLoaded || !details?.thumbnailImageUrl
              ? 'bg-gray-200 dark:bg-gray-700'
              : ''
          }`}
        >
          {details?.thumbnailImageUrl && isVisible && (
            <>
              <div
                className="absolute inset-0 scale-110 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${details.thumbnailImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(4px)',
                }}
              />
              {/* <img
                src={details.imageUrl}
                alt={details.name}
                className={`relative w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setIsImageLoaded(true)}
              /> */}
            </>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center group/title">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
              <button
                type="button"
                className="hover:underline flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  openUrlMutation.mutate(
                    `https://vrchat.com/home/world/${worldId}/info`,
                  );
                }}
              >
                {details?.name || worldName}
                <ExternalLink className="h-4 w-4 ml-1 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </button>
              <span className="ml-3 text-sm font-normal opacity-90 flex gap-1 items-center">
                <ImageIcon className="h-5 w-5" />
                <span>({photoCount})</span>
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                {t('locationHeader.share')}
              </button>
              <div className="flex items-center text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full">
                <Calendar className="h-4 w-4 mr-1.5" />
                {formattedDate}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center">
              {details?.authorName && (
                <span className="opacity-90">By {details.authorName}</span>
              )}
              <span className="mx-2 opacity-50">•</span>
              {worldInstanceId !== null && (
                <span className="opacity-75 text-xs">
                  Instance: {worldInstanceId}
                </span>
              )}
            </div>
            {details?.unityPackages && details.unityPackages.length > 0 && (
              <div className="flex items-center gap-1">
                {Array.from(
                  new Set(details.unityPackages.map((pkg) => pkg.platform)),
                ).map((platform) => (
                  <PlatformBadge key={platform} platform={platform} />
                ))}
              </div>
            )}
            {worldError && (
              <span className="text-yellow-500 dark:text-yellow-400 text-xs">
                ({t('locationHeader.worldInfoDeleted')})
              </span>
            )}
          </div>
          {!isPlayersLoading && players && players.length > 0 && (
            <div className="flex items-center mt-2 text-sm backdrop-blur-sm bg-black/20 self-start px-3 py-1 rounded-full w-full">
              <Users className="h-4 w-4 mr-1.5" />
              <div
                ref={playerListContainerRef}
                className="relative cursor-pointer w-full group/players"
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
                  {!isCopied && (
                    <PlayerList
                      players={players}
                      maxVisiblePlayers={maxVisiblePlayers}
                    />
                  )}
                  <span className="ml-2 transition-opacity">
                    {isCopied ? (
                      <span className="text-green-400">
                        <CheckIcon className="h-4 w-4 inline-block" />{' '}
                        {t('locationHeader.copied')}
                      </span>
                    ) : (
                      <Copy className="h-3 w-3 inline-block opacity-0 group-hover/players:opacity-100 transition-opacity" />
                    )}
                  </span>
                </div>
              </div>
              {
                createPortal(
                  <div
                    style={{
                      position: 'fixed',
                      visibility: isHovered ? 'visible' : 'hidden',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 200ms',
                      top: tooltipPosition.top,
                      left: tooltipPosition.left,
                    }}
                    className="z-50 p-4 bg-black/90 backdrop-blur-md text-white text-xs rounded-lg shadow-lg"
                  >
                    <div className="flex flex-wrap gap-2 max-w-[600px]">
                      {players.map((p: Player) => (
                        <span
                          key={p.id}
                          className="bg-white/10 px-3 py-1 rounded-full"
                        >
                          {p.playerName}
                        </span>
                      ))}
                    </div>
                  </div>,
                  document.body,
                ) as ReactPortal
              }
            </div>
          )}
        </div>
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        worldName={details?.name || worldName}
        imageUrl={details?.imageUrl || null}
        players={players}
      />
    </div>
  );
};

export default LocationGroupHeader;
