import React, { memo } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';
import { LocationDetail } from '../types/location';
import { locationDetails } from '../data/locationDetails';

interface LocationGroupHeaderProps {
  groupName: string;
  photoCount: number;
  date: string;
}

const LocationGroupHeader = memo(({ groupName, photoCount, date }: LocationGroupHeaderProps) => {
  const details = locationDetails[groupName];
  if (!details) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img
          src={details.coverImage}
          alt={details.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold flex items-center">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
              {details.name}
              <span className="ml-3 text-sm font-normal opacity-90">
                ({photoCount}枚)
              </span>
            </h3>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              {date}
            </div>
          </div>
          <p className="text-sm opacity-90 mt-1">{details.prefecture}</p>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {details.description}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4 mr-1.5" />
            {details.yearlyVisitors}
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1.5" />
            おすすめ時期: {details.bestSeason}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {details.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

LocationGroupHeader.displayName = 'LocationGroupHeader';

export default LocationGroupHeader;