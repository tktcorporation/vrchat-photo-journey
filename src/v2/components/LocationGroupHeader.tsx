import { trpcReact } from '@/trpc';
import { Calendar, MapPin, Users } from 'lucide-react';
import React, { memo } from 'react';

interface LocationGroupHeaderProps {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  photoCount: number;
  joinDateTime: Date;
}

const LocationGroupHeader = memo(
  ({
    worldId,
    worldName,
    worldInstanceId,
    photoCount,
    joinDateTime,
  }: LocationGroupHeaderProps) => {
    const { data: details } =
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId);
    if (!details) return null;

    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(joinDateTime);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="relative h-48 overflow-hidden">
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
          </div>
        </div>
      </div>
    );
  },
);

LocationGroupHeader.displayName = 'LocationGroupHeader';

export default LocationGroupHeader;
