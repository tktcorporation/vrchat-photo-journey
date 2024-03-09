import { trpcReact } from '@/trpc';
import { Ban, Loader } from 'lucide-react';
import type React from 'react';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export interface PhotoProps extends React.HTMLAttributes<HTMLDivElement> {
  photoPath: string;
  onClickPhoto: (photoPath: string) => void;
}

const VrcPhoto = ({ photoPath, ...props }: PhotoProps) => {
  const photoName = photoPath.split('/').pop();
  const query = trpcReact.getVRChatPhotoItemData.useQuery(photoPath);
  const { data, isLoading } = query;

  if (isLoading) {
    return <Loader className="w-8 h-8" />;
  }
  if (!data) {
    return <Ban className="w-8 h-8" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <button type="button" onClick={() => props.onClickPhoto?.(photoPath)}>
            <div
              {...props}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full',
                props.className,
              )}
            >
              <img src={data} className="w-full h-full" alt="" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{photoName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VrcPhoto;
