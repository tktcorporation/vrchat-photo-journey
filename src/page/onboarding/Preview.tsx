import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function OnBordingPreview({ className }: Props) {
  return (
    <div className={cn('space-y-4', className)}>
      osyasinn
      <div className="col-span-4">
        <ScrollArea>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            sample
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
