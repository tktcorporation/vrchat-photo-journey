import { trpcReact } from '@/trpc';
import { format } from 'date-fns';
import { Calendar, Laptop, MapPin, Users } from 'lucide-react';
import React, { memo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

export const LocationGroupHeader = ({
  worldId,
  worldName,
  worldInstanceId,
  photoCount,
  joinDateTime,
}: LocationGroupHeaderProps) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [shouldLoadDetails, setShouldLoadDetails] = useState(false);
  const playerListRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({
      top: event.clientY + 16,
      left: event.clientX,
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          // 表示されてから少し待ってからデータを読み込む
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

  // ワールドの詳細情報を取得
  const { data: details, error: worldError } =
    trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId ?? '', {
      enabled: worldId !== null && shouldLoadDetails,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    });

  // 同じワールドにいたプレイヤーリストを取得
  const { data: playersResult, isLoading: isPlayersLoading } =
    trpcReact.logInfo.getPlayerListInSameWorld.useQuery(joinDateTime, {
      enabled: worldId !== null && shouldLoadDetails,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    });

  const formattedDate = format(joinDateTime, 'yyyy年MM月dd日 HH:mm');

  // プレイヤーリストがエラーの場合は表示しない
  const players = Array.isArray(playersResult) ? playersResult : null;

  if (worldId === null) {
    return (
      <header className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-x-2">
          <h2 className="text-lg font-bold">Ungrouped Photos</h2>
          <span className="text-sm text-gray-500">{photoCount}枚の写真</span>
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
      <div className="relative h-48 overflow-hidden">
        <div
          className={`absolute inset-0 ${
            !isImageLoaded || !details?.thumbnailImageUrl
              ? 'bg-gray-200 dark:bg-gray-700'
              : ''
          }`}
        >
          {details?.thumbnailImageUrl && isVisible && (
            <img
              src={details.thumbnailImageUrl}
              alt={details.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setIsImageLoaded(true)}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold flex items-center">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
              {worldName}
              <span className="ml-3 text-sm font-normal opacity-90">
                ({photoCount}枚)
              </span>
            </h3>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              {formattedDate}
            </div>
          </div>
          <p className="text-sm opacity-90 mt-1">
            {details?.authorName && details.authorName}
            <span className="ml-2 text-xs opacity-75">
              Instance: {worldInstanceId}
            </span>
            {details?.unityPackages && details.unityPackages.length > 0 && (
              <span className="ml-2 flex items-center gap-1">
                {Array.from(
                  new Set(details.unityPackages.map((pkg) => pkg.platform)),
                ).map((platform) => (
                  <PlatformBadge key={platform} platform={platform} />
                ))}
              </span>
            )}
            {worldError && (
              <span className="text-yellow-500 dark:text-yellow-400">
                (ワールド情報は削除されています)
              </span>
            )}
          </p>
          {!isPlayersLoading && players && players.length > 0 && (
            <div className="flex items-center mt-2 text-sm">
              <Users className="h-4 w-4 mr-1.5" />
              <span
                ref={playerListRef}
                className="relative cursor-help"
                title=""
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
              >
                <span className="opacity-75">一緒にいた人: </span>
                {players.length <= 6 ? (
                  <>
                    {players.map((p: Player, index) => (
                      <React.Fragment key={p.id}>
                        <span className="opacity-90">{p.playerName}</span>
                        {index < players.length - 1 && (
                          <span className="opacity-50"> , </span>
                        )}
                      </React.Fragment>
                    ))}
                    {createPortal(
                      <div
                        style={{
                          position: 'fixed',
                          visibility: isHovered ? 'visible' : 'hidden',
                          opacity: isHovered ? 1 : 0,
                          transition: 'opacity 200ms',
                          top: tooltipPosition.top,
                          left: tooltipPosition.left,
                        }}
                        className="z-50 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
                      >
                        <div className="flex flex-wrap gap-2 max-w-[600px]">
                          {players.map((p: Player) => (
                            <span
                              key={p.id}
                              className="bg-gray-800 px-3 py-1 rounded-md"
                            >
                              {p.playerName}
                            </span>
                          ))}
                        </div>
                      </div>,
                      document.body,
                    )}
                  </>
                ) : (
                  <>
                    {players.slice(0, 6).map((p: Player, index) => (
                      <React.Fragment key={p.id}>
                        <span className="opacity-90">{p.playerName}</span>
                        {index < 5 && <span className="opacity-50"> , </span>}
                      </React.Fragment>
                    ))}
                    <span className="opacity-75">
                      {' '}
                      他{players.length - 6}人
                    </span>
                    {createPortal(
                      <div
                        style={{
                          position: 'fixed',
                          visibility: isHovered ? 'visible' : 'hidden',
                          opacity: isHovered ? 1 : 0,
                          transition: 'opacity 200ms',
                          top: tooltipPosition.top,
                          left: tooltipPosition.left,
                        }}
                        className="z-50 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
                      >
                        <div className="flex flex-wrap gap-2 max-w-[600px]">
                          {players.map((p: Player) => (
                            <span
                              key={p.id}
                              className="bg-gray-800 px-3 py-1 rounded-md"
                            >
                              {p.playerName}
                            </span>
                          ))}
                        </div>
                      </div>,
                      document.body,
                    )}
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationGroupHeader;
