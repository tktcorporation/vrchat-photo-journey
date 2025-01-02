import { useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../types/photo';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';

interface GroupedPhoto {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  photos: Photo[];
}

interface GalleryContentProps {
  groupedPhotos: Record<string, GroupedPhoto>;
  onPhotoSelect: (photo: Photo) => void;
}

const BATCH_SIZE = 10;

export const GalleryContent = ({
  groupedPhotos,
  onPhotoSelect,
}: GalleryContentProps) => {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const groupEntries = useMemo(() => {
    return Object.entries(groupedPhotos);
  }, [groupedPhotos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < groupEntries.length) {
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, groupEntries.length),
          );
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, groupEntries.length]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[2000px] mx-auto py-8">
        <div className="space-y-8 px-4">
          {groupEntries.slice(0, visibleCount).map(([key, group]) => (
            <section key={key}>
              <LocationGroupHeader
                worldId={group.worldId}
                worldName={group.worldName}
                worldInstanceId={group.worldInstanceId}
                photoCount={group.photos.length}
                joinDateTime={group.joinDateTime}
              />
              <div className="mt-4">
                <PhotoGrid
                  photos={group.photos}
                  onPhotoSelect={onPhotoSelect}
                />
              </div>
            </section>
          ))}
          {visibleCount < groupEntries.length && (
            <div ref={loadMoreRef} className="h-20" aria-hidden="true" />
          )}
        </div>
      </div>
    </main>
  );
};

export default GalleryContent;
