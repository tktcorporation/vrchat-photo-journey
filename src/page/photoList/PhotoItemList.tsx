import { trpcReact } from '@/trpc';
import React from 'react';

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
interface PhotoItemListProps {
  photoItemList?: JoinInfo[] | null;
}
export const PhotoItemList = ({ photoItemList }: PhotoItemListProps) => {
  const openPhotoPathMutation = trpcReact.openPathOnExplorer.useMutation();
  return (
    <div className="col-span-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-5">
        {photoItemList?.map((item) => {
          // item.photoList がある場合は写真一覧を表示する
          const photoList = item.photoList.map((photo) => (
            <div
              key={`photo-container-${photo.datetime.toISOString()}`}
              className="col-span-1"
            >
              <VrcPhoto
                key={photo.path}
                photoPath={photo.path}
                onClickPhoto={() => {
                  openPhotoPathMutation.mutate(photo.path);
                }}
              />
            </div>
          ));
          return (
            <>
              <div
                key={`world-info-${item.joinDatetime.toISOString()}`}
                className="col-span-full"
              >
                <WorldInfo
                  vrcWorldId={item.worldId}
                  datetime={item.joinDatetime}
                />
              </div>
              {photoList}
            </>
          );
        })}
      </div>
    </div>
  );
};
