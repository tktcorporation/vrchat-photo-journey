import Photo from '@/components/ui/Photo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function JoinInfoPreview({ className }: Props) {
  const infoMap = trpcReact.getWorldJoinInfoWithPhotoPath.useQuery().data;

  return (
    <div className={cn('space-y-4 overflow-hidden', className)}>
      <div>
        <p>このように、写真とワールドの情報を紐付けることができます</p>
        <p>
          (紐づけを行えるのは最後のVRChat起動から約24時間ほど前までに撮った写真です)
        </p>
      </div>
      <div className="py-4 space-y-4 overflow-hidden">
        <ScrollArea>
          {infoMap?.map((item) => {
            if (item.tookPhotoList.length === 0) return null;
            return (
              <div>
                <p className="text-lg">{item.world.worldName}</p>
                <p className="text-sm text-gray-500">
                  Join日時: {item.world.joinDatetime}
                </p>
                <div className="flex flex-row space-x-2">
                  {item.tookPhotoList.map((photo) => {
                    return (
                      <Photo
                        photoPath={photo.photoPath}
                        className="w-32"
                        key={photo.photoPath}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
