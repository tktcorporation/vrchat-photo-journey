import PhotoByBuff from '@/components/ui/PhotoByBuff';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function OnBordingPreview(props: Props) {
  const infoMap = trpcReact.getToCreateInfoFileMap.useQuery().data;

  return (
    <div className={cn('space-y-4', props.className)}>
      osyasinn
      <div className="col-span-4">
        <ScrollArea>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {infoMap?.map((item) => {
              const content = <PhotoByBuff bufferString={item.content} />;

              return <div key={item.fileName}>{content}</div>;
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
