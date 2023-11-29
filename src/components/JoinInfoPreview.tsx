import Photo from '@/components/ui/Photo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function JoinInfoPreview({ className }: Props) {
  const infoMap = trpcReact.getWorldJoinInfoWithPhotoPath.useQuery().data;

  return (
    <div className={cn('space-y-4 flex flex-col h-full', className)}>
      <ScrollArea>
        <div className="flex-grow overflow-y space-y-8">
          {infoMap?.map((item) => {
            if (item.tookPhotoList.length === 0) return null;
            return (
              <div
                className="space-y-3 basis-1/2"
                key={item.world.joinDatetime}
              >
                <div>
                  <p className="text-lg">{item.world.worldName}</p>
                  <p className="text-sm text-gray-500">
                    Join日時: {item.world.joinDatetime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {item.tookPhotoList.map((photo) => {
                    return (
                      <Photo
                        photoPath={photo.photoPath}
                        className="w-32"
                        key={photo.tookDatetime}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
