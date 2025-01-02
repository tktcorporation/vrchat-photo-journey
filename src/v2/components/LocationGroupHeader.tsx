import { trpcReact } from '@/trpc';
import { Calendar, MapPin, Users } from 'lucide-react';
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
  worldId: string;
  worldName: string;
  worldInstanceId: string;
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

const LocationGroupHeader = memo(
  ({
    worldId,
    worldName,
    worldInstanceId,
    photoCount,
    joinDateTime,
  }: LocationGroupHeaderProps) => {
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const playerListRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (event: React.MouseEvent) => {
      setTooltipPosition({
        top: event.clientY + 16,
        left: event.clientX,
      });
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // 一度表示されたら、その後は常に表示状態を維持
          if (entries.some((entry) => entry.isIntersecting)) {
            setIsVisible(true);
          }
        },
        {
          // より小さいマージンに調整
          rootMargin: '50px',
          // 少しでも画面内に入ったら検知
          threshold: 0,
        },
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
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
    const { data: details } =
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId, {
        enabled: isVisible,
        // キャッシュを有効化
        staleTime: 1000 * 60 * 5, // 5分
        cacheTime: 1000 * 60 * 30, // 30分
      });

    // 同じワールドにいたプレイヤーリストを取得
    const { data: playersResult } =
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery(joinDateTime, {
        enabled: isVisible,
        // キャッシュを有効化
        staleTime: 1000 * 60 * 5, // 5分
        cacheTime: 1000 * 60 * 30, // 30分
      });

    // 最小限の高さを持つプレースホルダーを表示
    if (!details && isVisible) {
      return (
        <div
          ref={containerRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden min-h-[12rem]"
        />
      );
    }

    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(joinDateTime);

    // プレイヤーリストがエラーの場合は表示しない
    const players = Array.isArray(playersResult) ? playersResult : null;

    return (
      <div
        ref={containerRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
      >
        <div className="relative h-48 overflow-hidden">
          {isVisible && details && (
            <>
              <img
                src={details.thumbnailImageUrl}
                alt={details.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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
                  {details.authorName}
                  <span className="ml-2 text-xs opacity-75">
                    Instance: {worldInstanceId}
                  </span>
                </p>
                {players && players.length > 0 && (
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
                              {index < 5 && (
                                <span className="opacity-50"> , </span>
                              )}
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
            </>
          )}
        </div>
      </div>
    );
  },
);

LocationGroupHeader.displayName = 'LocationGroupHeader';

export default LocationGroupHeader;
