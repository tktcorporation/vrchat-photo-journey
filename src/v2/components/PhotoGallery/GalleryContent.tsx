import { useStartupStage } from '@/v2/hooks/useStartUpStage';
import { RefreshCw } from 'lucide-react';
import { memo, useMemo, useRef } from 'react';
import { useI18n } from '../../i18n/store';
import type { Photo } from '../../types/photo';
import LocationGroupHeader from '../LocationGroupHeader';
import PhotoGrid from '../PhotoGrid';
import { useGroupInView } from './useGroupInView';
import type { GroupedPhoto } from './useGroupPhotos';

interface GalleryContentProps {
  groupedPhotos: Record<string, GroupedPhoto>;
  onPhotoSelect: (photo: Photo) => void;
}

const GalleryContent = memo(
  ({ groupedPhotos, onPhotoSelect }: GalleryContentProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { groupRefs } = useGroupInView(
      contentRef,
      Object.keys(groupedPhotos),
    );
    const { t } = useI18n();

    const { finished } = useStartupStage({
      onError: (error) => {
        throw error;
      },
    });

    const isPhotoRefetching = !finished;

    const groupEntries = useMemo(() => {
      return Object.entries(groupedPhotos);
    }, [groupedPhotos]);

    return (
      <main ref={contentRef} className="flex-1 overflow-y-auto relative">
        <div className="max-w-[2000px] mx-auto py-8">
          {isPhotoRefetching && (
            <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t('写真を更新中...')}</span>
            </div>
          )}

          <div className="space-y-8 px-4">
            {groupEntries.map(([key, group]) => (
              <section
                key={key}
                ref={(el) => {
                  if (el) {
                    groupRefs.current.set(key, el as HTMLDivElement);
                  } else {
                    groupRefs.current.delete(key);
                  }
                }}
                data-group-name={key}
              >
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
          </div>
        </div>
      </main>
    );
  },
  (prevProps, nextProps) => {
    return (
      Object.keys(prevProps.groupedPhotos).length ===
        Object.keys(nextProps.groupedPhotos).length &&
      Object.entries(prevProps.groupedPhotos).every(
        ([key, value]) =>
          nextProps.groupedPhotos[key] &&
          value.photos.length === nextProps.groupedPhotos[key].photos.length,
      )
    );
  },
);

export default GalleryContent;
