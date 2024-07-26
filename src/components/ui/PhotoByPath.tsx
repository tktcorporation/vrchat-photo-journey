import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { trpcReact } from '@/trpc';
import { Ban, Loader } from 'lucide-react';
import type React from 'react';

interface WrapperProps extends React.HTMLAttributes<HTMLDivElement> {}
const Wrapper = ({ children, ...props }: WrapperProps): React.ReactElement => {
  // dataがオブジェクトで、その中の画像URLを指定するプロパティが `url` だと仮定
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col items-center justify-center',
        props.className,
      )}
    >
      {children}
    </div>
  );
};

export interface PhotoProps extends React.HTMLAttributes<HTMLDivElement> {
  photoPath: string;
  alt: string;
  objectFit?: 'cover' | 'contain';
}
export function PhotoByPath({
  photoPath,
  alt,
  objectFit = 'cover',
  ...props
}: PhotoProps) {
  const query =
    trpcReact.electronUtil.getVRChatPhotoItemData.useQuery(photoPath);
  const { data, isLoading } = query;

  // 条件レンダリングを適切に修正します
  if (isLoading) {
    return (
      <Wrapper {...props}>
        <Skeleton className="w-full h-full" />
      </Wrapper>
    );
  }

  if (!data) {
    // icon
    return (
      <Wrapper {...props}>
        <Ban size={48} />
      </Wrapper>
    );
  }

  return (
    <Wrapper {...props}>
      <img src={data} className={cn('object-cover w-full h-full')} alt={alt} />
    </Wrapper>
  );
}
