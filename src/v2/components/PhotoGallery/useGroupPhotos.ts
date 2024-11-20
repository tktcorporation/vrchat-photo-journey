import { useMemo } from 'react';
import { locationDetails } from '../../data/locationDetails';
import type { Photo } from '../../types/photo';

interface GroupedPhotos {
  [key: string]: {
    photos: Photo[];
    location: string;
    date: string;
    locationDetail: (typeof locationDetails)[keyof typeof locationDetails];
  };
}

export function useGroupPhotos(photos: Photo[]) {
  return useMemo(() => {
    // 日付でソート（新しい順）
    const sorted = [...photos].sort(
      (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
    );

    return sorted.reduce((groups: GroupedPhotos, photo) => {
      const date = photo.takenAt;
      const dateKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      const locationKey = `${photo.location.prefecture} - ${photo.location.name}`;
      const groupKey = `${locationKey}/${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          photos: [],
          location: locationKey,
          date: dateKey,
          locationDetail: locationDetails[locationKey],
        };
      }

      groups[groupKey].photos.push(photo);
      return groups;
    }, {});
  }, [photos]);
}
