import VrcPhoto from '@/components/ui/VrcPhoto';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import type React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function JoinInfoPreview({ className }: Props) {
  const query = trpcReact.getWorldJoinInfoWithPhotoPath.useQuery;
  const { data } = query();
  const infoMap = data?.data;
  const error = data?.error;

  const openPhotoPathMutation = trpcReact.openPathOnExplorer.useMutation();

  const PhotoList = (
    tookPhotoList: {
      photoPath: string;
      tookDatetime: string;
    }[],
  ) => {
    return tookPhotoList.map((photo) => {
      return (
        <VrcPhoto
          onClickPhoto={() => openPhotoPathMutation.mutate(photo.photoPath)}
          photoPath={photo.photoPath}
          className="w-32"
          key={photo.tookDatetime}
        />
      );
    });
  };

  return (
    <div className={cn('space-y-4 flex flex-col h-full', className)}>
      <ScrollArea>
        <div className="flex-grow overflow-y space-y-8">
          {error ? (
            <div className="text-red-500">
              {error.code} {error.message}
            </div>
          ) : (
            infoMap?.map((item) => {
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
                    {PhotoList(item.tookPhotoList)}
                  </div>
                </div>
              );
            }) ?? <div>データがありません</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
