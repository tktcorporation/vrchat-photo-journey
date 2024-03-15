import { trpcReact } from '@/trpc';
import { useInView } from 'react-intersection-observer';

import VrcPhoto from '@/components/ui/VrcPhoto';
import { WorldInfo } from './WorldInfo';

interface JoinInfo {
  joinDatetime: Date;
  worldId: string;
  imgPath: string;
  photoList: {
    datetime: Date;
    path: string;
  }[];
}
const JoinInfoItem = ({ item }: { item: JoinInfo }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const openPhotoPathMutation = trpcReact.openPathOnExplorer.useMutation();

  return (
    <div ref={ref} className="col-span-full">
      {inView ? (
        <>
          <WorldInfo vrcWorldId={item.worldId} datetime={item.joinDatetime} />
          {item.photoList.length > 0 && (
            <div className="flex flex-wrap gap-4 my-6">
              {item.photoList.map((photo) => (
                <div
                  key={`photo-container-${photo.datetime.toISOString()}`}
                  className="w-48"
                >
                  <VrcPhoto
                    photoPath={photo.path}
                    onClickPhoto={() =>
                      openPhotoPathMutation.mutate(photo.path)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="font-medium">{item.worldId}</p>
      )}
    </div>
  );
};

interface JoinInfoListProps {
  joinInfoList?: JoinInfo[] | null;
}
export const JoinInfoList = ({ joinInfoList }: JoinInfoListProps) => {
  return (
    <div className="flex flex-col gap-7">
      {joinInfoList?.map((item) => {
        return (
          <JoinInfoItem key={item.joinDatetime.toISOString()} item={item} />
        );
      })}
    </div>
  );
};
