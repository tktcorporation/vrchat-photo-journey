import React, { useCallback, useMemo } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useVirtualPhotos } from '../hooks/useVirtualPhotos';
import type { Photo } from '../types/photo';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
  layout?: 'horizontal' | 'vertical';
}

const PhotoGrid: React.FC<PhotoGridProps> = React.memo(
  ({ photos, onPhotoSelect }) => {
    const [containerRef, { width: containerWidth }] =
      useResizeObserver<HTMLDivElement>();
    const { visiblePhotos, isLoading } = useVirtualPhotos(photos);

    const getColumnCount = useCallback((width: number) => {
      if (width < 640) return 2;
      if (width < 1024) return 3;
      if (width < 1536) return 4;
      return 5;
    }, []);

    const columnCount = useMemo(
      () => getColumnCount(containerWidth || window.innerWidth),
      [containerWidth, getColumnCount],
    );

    const photoColumns = useMemo(() => {
      const columns: Photo[][] = Array.from({ length: columnCount }, () => []);

      visiblePhotos.forEach((photo, index) => {
        columns[index % columnCount].push(photo);
      });

      return columns;
    }, [visiblePhotos, columnCount]);

    if (!photos?.length) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          写真が見つかりませんでした
        </div>
      );
    }

    return (
      <div ref={containerRef}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {photoColumns.map((column, columnIndex) => (
            <div
              key={`column-${columnIndex}-${column[0]?.id ?? columnIndex}`}
              className="space-y-2"
            >
              {column.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  priority={columnIndex < 2}
                  onSelect={onPhotoSelect}
                />
              ))}
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="h-20 flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Loading..."
              >
                <title>Loading...</title>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>写真を読み込み中...</span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

PhotoGrid.displayName = 'PhotoGrid';

export default PhotoGrid;
