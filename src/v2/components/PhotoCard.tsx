import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { trpcReact } from '@/trpc';
import type React from 'react';
import { memo, useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useI18n } from '../i18n/store';
import type { Photo } from '../types/photo';
import ProgressiveImage from './ProgressiveImage';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
  onSelect: (photo: Photo) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = memo(
  ({ photo, priority = false, onSelect }) => {
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

    return (
      <div
        ref={elementRef}
        className="group relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
        onClick={() => onSelect(photo)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(photo);
          }
        }}
        role="button"
        tabIndex={0}
        style={{
          aspectRatio: `${photo.width} / ${photo.height}`,
        }}
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold truncate text-sm">
                  {photo.url}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  photo.location.description
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent onClick={(e) => e.stopPropagation()}>
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
