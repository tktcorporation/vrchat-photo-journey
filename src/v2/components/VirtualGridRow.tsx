import React from 'react';
import type { Photo } from '../types/photo';
import PhotoCard from './PhotoCard';

interface VirtualGridRowProps {
  photos: Photo[];
  worldId: string | null;
  start: number;
  height: number;
  isPriority?: boolean;
  onPhotoSelect: (photo: Photo) => void;
}

const VirtualGridRow: React.FC<VirtualGridRowProps> = React.memo(
  ({
    photos = [],
    worldId,
    start,
    height,
    isPriority = false,
    onPhotoSelect,
  }) => {
    if (!photos || photos.length === 0) return null;

    // Calculate relative widths for photos in the row
    const totalAspectRatio = photos.reduce(
      (sum, photo) => sum + photo.width / photo.height,
      0,
    );
    const containerWidth = 100; // percentage
    const gapWidth = 1; // Increased gap between photos
    const totalGapWidth = (photos.length - 1) * gapWidth;
    const availableWidth = containerWidth - totalGapWidth;

    let currentPosition = 0;
    const photoLayouts = photos.map((photo) => {
      const aspectRatio = photo.width / photo.height;
      const relativeWidth = (aspectRatio / totalAspectRatio) * availableWidth;
      const layout = {
        width: `${relativeWidth}%`,
        left: `${currentPosition}%`,
      };
      currentPosition += relativeWidth + gapWidth;
      return layout;
    });

    return (
      <div
        className="absolute left-0 right-0 px-6" // Increased padding
        style={{
          transform: `translateY(${start}px)`,
          height: `${height}px`,
          willChange: 'transform',
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="absolute top-0 bottom-2 transition-transform hover:z-10" // Added bottom margin
            style={{
              width: photoLayouts[index].width,
              left: photoLayouts[index].left,
            }}
          >
            <PhotoCard
              photo={photo}
              worldId={worldId}
              priority={isPriority}
              onSelect={onPhotoSelect}
            />
          </div>
        ))}
      </div>
    );
  },
);

VirtualGridRow.displayName = 'VirtualGridRow';

export default VirtualGridRow;
