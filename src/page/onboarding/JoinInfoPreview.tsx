import Photo from '@/components/ui/Photo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function JoinInfoPreview({ className }: Props) {
  const infoMap = trpcReact.getWorldJoinInfoWithPhotoPath.useQuery().data;

  return (
    <div className={cn('space-y-4', className)}>
      osyasinn
      <div className="col-span-4">
        <ScrollArea>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {infoMap?.map((item) => {
              return (
                <>
                  <p>{item.world.joinDatetime}</p>
                  <p>{item.world.worldName}</p>
                  {item.tookPhotoList.map((photo) => {
                    return <Photo photoPath={photo.photoPath} />;
                  })}
                </>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
