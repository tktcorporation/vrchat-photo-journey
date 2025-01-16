import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { trpcReact } from '@/trpc';
import type React from 'react';
import { memo, useRef } from 'react';
import { P, match } from 'ts-pattern';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useI18n } from '../i18n/store';
import type { Photo } from '../types/photo';
import { generatePreviewPng } from '../utils/previewGenerator';
import ProgressiveImage from './ProgressiveImage';

interface PhotoCardProps {
  photo: Photo;
  worldId: string | null;
  priority?: boolean;
  onSelect: (photo: Photo) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = memo(
  ({ photo, worldId, priority = false, onSelect }) => {
    const { t } = useI18n();
    const elementRef = useRef<HTMLDivElement>(null);
    const isIntersecting = useIntersectionObserver(elementRef, {
      threshold: 0,
      rootMargin: '200px',
    });

    const shouldLoad = priority || isIntersecting;
    const placeholderUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${photo.width} ${photo.height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;

    const { data: photoData } =
      trpcReact.vrchatPhoto.getVRChatPhotoItemData.useQuery(photo.url, {
        enabled: shouldLoad,
      });

    const mutation = trpcReact.electronUtil.copyImageDataByPath.useMutation();
    const handleCopyPhotoData = (e: React.MouseEvent) => {
      e.stopPropagation();
      mutation.mutate(photo.url);
    };

    const openInPhotoAppMutation =
      trpcReact.electronUtil.openPhotoPathWithPhotoApp.useMutation();
    const handleOpenInPhotoApp = (e: React.MouseEvent) => {
      e.stopPropagation();
      openInPhotoAppMutation.mutate(photo.url);
    };

    const openDirOnExplorerMutation = trpcReact.openDirOnExplorer.useMutation();
    const handleOpenInExplorer = (e: React.MouseEvent) => {
      e.stopPropagation();
      openDirOnExplorerMutation.mutate(photo.url);
    };

    const { data: worldInfo } =
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId ?? '', {
        enabled: !!worldId,
      });
    const { data: players } =
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery(photo.takenAt);
    const copyMutation =
      trpcReact.electronUtil.copyImageDataByBase64.useMutation();

    const handleShare = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!photoData?.data) {
        console.error('Photo data is not available');
        return;
      }

      try {
        const base64Data = photoData.data.includes('base64,')
          ? photoData.data.split('base64,')[1]
          : photoData.data;

        const previewImage = await generatePreviewPng({
          worldName: worldInfo?.name ?? 'Unknown World',
          imageBase64: base64Data,
          players: match(players)
            .with(P.nullish, () => [])
            .with({ errorMessage: 'RECENT_JOIN_LOG_NOT_FOUND' }, () => [])
            .otherwise((players) =>
              players.map((player) => ({
                playerName: player.playerName,
              })),
            ),
          showAllPlayers: false,
        });

        await copyMutation.mutateAsync({
          pngBase64: previewImage,
          filename: `${photo.fileName}_share.png`,
        });

        console.log('Image successfully copied to clipboard');
      } catch (error) {
        console.error('Failed to generate or copy share image:', error);
      }
    };

    return (
      <div
        ref={elementRef}
        className="group relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer transform transition-all duration-300 hover:brightness-110"
        onClick={() => onSelect(photo)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(photo);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <ContextMenu>
          <ContextMenuTrigger className="absolute inset-0">
            {shouldLoad ? (
              <ProgressiveImage
                src={photoData?.data || ''}
                placeholderSrc={placeholderUrl}
                alt={photo.fileName || ''}
                className="absolute inset-0 w-full h-full object-cover"
                loading={priority ? 'eager' : 'lazy'}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse"
                style={{ aspectRatio: `${photo.width / photo.height}` }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-white font-medium truncate text-xs">
                  {photo.fileName}
                </h3>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent onClick={(e) => e.stopPropagation()}>
            <ContextMenuItem onClick={handleShare}>
              {t('common.contextMenu.shareImage')}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyPhotoData}>
              {t('common.contextMenu.copyPhotoData')}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleOpenInPhotoApp}>
              {t('common.contextMenu.openInPhotoApp')}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleOpenInExplorer}>
              {t('common.contextMenu.showInExplorer')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  },
);

PhotoCard.displayName = 'PhotoCard';

export default PhotoCard;
