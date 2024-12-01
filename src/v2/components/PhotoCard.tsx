import { trpcReact } from '@/trpc';
import type React from 'react';
import { memo } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import type { Photo } from '../types/photo';
import ProgressiveImage from './ProgressiveImage';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
  onSelect: (photo: Photo) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = memo(
  ({ photo, priority = false, onSelect }) => {
    const [ref, entry] = useIntersectionObserver({
      threshold: 0,
      rootMargin: '200px',
    });

    const shouldLoad = priority || (entry?.isIntersecting ?? false);
    const placeholderUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${photo.width} ${photo.height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;

    const { data: photoData } =
      trpcReact.vrchatPhoto.getVRChatPhotoItemData.useQuery(photo.url, {
        enabled: shouldLoad,
      });

    return (
      <div
        ref={ref}
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
        {shouldLoad ? (
          <ProgressiveImage
            src={photoData?.data || ''}
            placeholderSrc={placeholderUrl}
            alt={photo.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'auto'}
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
              {photo.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {photo.tags.slice(0, 3).map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PhotoCard.displayName = 'PhotoCard';

export default PhotoCard;
