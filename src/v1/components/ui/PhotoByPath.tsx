import { trpcReact } from '@/trpc';
import { Skeleton } from '@/v1/components/ui/skeleton';
import { cn } from '@/v1/lib/utils';
import { Ban, Loader } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { P, match } from 'ts-pattern';

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
  onPathNotFound?: () => void;
  objectFit?: 'cover' | 'contain';
}
export function PhotoByPath({
  photoPath,
  alt,
  objectFit = 'cover',
  onPathNotFound,
  ...props
}: PhotoProps) {
  const query = trpcReact.vrchatPhoto.getVRChatPhotoItemData.useQuery(
    photoPath,
    // 10秒はcache
    { staleTime: 10000 },
  );
  const { data, isLoading } = query;

  useMemo(() => {
    match(data?.error)
      .with(P.nullish, () => {
        // 何もしない
      })
      .with('InputFileIsMissing', () => {
        onPathNotFound?.();
      })
      .exhaustive();
  }, [data]);

  const getContent = (): React.ReactElement => {
    if (isLoading) {
      return <Skeleton className="w-full h-full" />;
    }
    if (!data) {
      return <Ban size={48} />;
    }
    if (data.error) {
      return <Ban size={48} />;
    }
    return (
      <img
        src={data.data}
        className={cn('object-cover w-full h-full')}
        alt={alt}
      />
    );
  };

  return <Wrapper {...props}>{getContent()}</Wrapper>;
}
