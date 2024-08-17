import React, { useMemo } from 'react';

import { PhotoByPath } from '@/components/ui/PhotoByPath';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { trpcReact } from '@/trpc';
import * as dateFns from 'date-fns';
import { Globe, Image, Search } from 'lucide-react';
import { RenderInView } from './RenderInView';
import * as hooks from './hooks';

interface WorldJoinData {
  id: string;
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PhotoPathData {
  id: string;
  photoPath: string;
  photoTakenAt: Date;
}

type WorldJoinWithPhotos = {
  worldJoin: WorldJoinData | null;
  photos: PhotoPathData[];
}[];

function groupPhotosByWorldJoin(
  worldJoinData: WorldJoinData[],
  photoPathList: PhotoPathData[],
): WorldJoinWithPhotos {
  const result: WorldJoinWithPhotos = [];

  // worldJoinData を時系列降順にソート
  const sortedWorldJoinData = worldJoinData.sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  // photoPathList も時系列降順にソート
  const sortedPhotoPathList = photoPathList.sort(
    (a, b) => b.photoTakenAt.getTime() - a.photoTakenAt.getTime(),
  );

  let currentJoinIndex = 0;

  let currentGroup: {
    worldJoin: WorldJoinData | null;
    photos: PhotoPathData[];
  } = {
    worldJoin: null,
    photos: [],
  };

  // 写真を順番に処理
  for (const photo of sortedPhotoPathList) {
    // 次の worldJoin があるか確認
    while (
      currentJoinIndex < sortedWorldJoinData.length &&
      photo.photoTakenAt.getTime() <
        sortedWorldJoinData[currentJoinIndex].joinDateTime.getTime()
    ) {
      // 現在のグループを結果に追加
      if (currentGroup.worldJoin || currentGroup.photos.length > 0) {
        result.push(currentGroup);
      }

      // 新しいグループを開始
      currentGroup = {
        worldJoin: sortedWorldJoinData[currentJoinIndex],
        photos: [],
      };

      currentJoinIndex++;
    }

    // 現在のグループに写真を追加
    currentGroup.photos.push(photo);
  }

  // 最後のグループも結果に追加
  if (currentGroup.worldJoin || currentGroup.photos.length > 0) {
    result.push(currentGroup);
  }

  // 残りの worldJoin も追加
  while (currentJoinIndex < sortedWorldJoinData.length) {
    result.push({
      worldJoin: sortedWorldJoinData[currentJoinIndex],
      photos: [],
    });
    currentJoinIndex++;
  }

  return result;
}
const PhotoViewGroupedByJoin = (props: {
  vrchatWorldJoinDataList: {
    id: string;
    worldId: string;
    worldName: string;
    worldInstanceId: string;
    joinDateTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }[];
  photoPathList: {
    id: string;
    photoPath: string;
    photoTakenAt: Date;
  }[];
  photoWidth: number;
  gapWidth: number;
  onSelectPhotoFileName: (fileName: string) => void;
}): React.ReactElement => {
  const grouped = groupPhotosByWorldJoin(
    props.vrchatWorldJoinDataList,
    props.photoPathList,
  );
  return (
    <div className="space-y-6 w-full">
      {grouped.map((group) => (
        <div
          key={group.worldJoin?.id ? group.worldJoin.id : group.photos[0].id}
        >
          <Label className="bold">
            <span className="w-full text-lg">
              {group.worldJoin?.worldName ?? 'Unknown'}
            </span>
            <div className="text-muted-foreground">
              {group.worldJoin?.joinDateTime &&
                dateFns.format(
                  group.worldJoin.joinDateTime,
                  'yyyy/MM/dd (E) HH:mm',
                )}
            </div>
          </Label>
          <div
            className="flex flex-wrap mt-4"
            style={{ gap: `${props.gapWidth}px` }}
          >
            {group.photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  width: props.photoWidth,
                  height: props.photoWidth,
                }}
              >
                <RenderInView className="h-full w-full" delay={200}>
                  <PhotoByPathRevalidateOnPathNotFound
                    className="h-full w-full cursor-pointer hover:brightness-105"
                    photoPath={photo.photoPath}
                    onClick={() => props.onSelectPhotoFileName(photo.photoPath)}
                  />
                </RenderInView>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PhotoByPathRevalidateOnPathNotFound = (props: {
  photoPath: string;
  className?: string;
  onClick: () => void;
}) => {
  const mutation = trpcReact.vrchatPhoto.validateVRChatPhotoPath.useMutation();
  const onVRChatPhotoPathNotFound = () => {
    mutation.mutate(props.photoPath);
  };
  return (
    <PhotoByPath
      alt={props.photoPath}
      objectFit="cover"
      className={props.className}
      photoPath={props.photoPath}
      onPathNotFound={onVRChatPhotoPathNotFound}
      onClick={props.onClick}
    />
  );
};

export const PhotoListByYearMonth = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
  onChangeComponentHeight: (height: number) => void;
  photoTakenYear: number;
  photoTakenMonth: number;
  photoWidth: number;
  gapWidth: number;
}) => {
  // バーチャルスクロールのために高さを伝える
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  hooks.useComponentHeight({
    ref: rootRef,
    onChange: (height) => height && props.onChangeComponentHeight(height),
  });

  // 月初
  const startOfMonth = dateFns.startOfMonth(
    new Date(props.photoTakenYear, props.photoTakenMonth - 1),
  );
  // 次の月初
  const endOfMonth = dateFns.startOfMonth(dateFns.addMonths(startOfMonth, 1));
  const { data: photoPathList } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery({
      gtPhotoTakenAt: startOfMonth,
      ltPhotoTakenAt: endOfMonth,
      orderByPhotoTakenAt: 'desc',
    });

  const { data: vrchatWorldJoinDataList } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery({
      gtJoinDateTime: startOfMonth,
      ltJoinDateTime: endOfMonth,
      orderByJoinDateTime: 'desc',
    });

  return (
    <div ref={rootRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-lg">
          {`${props.photoTakenYear}/${props.photoTakenMonth}`}
        </div>
        <div className="flex items-center space-x-2">
          <Image size={20} />
          <Badge variant={'outline'}>{`${photoPathList?.length}枚`}</Badge>
        </div>
      </div>
      <PhotoViewGroupedByJoin
        vrchatWorldJoinDataList={vrchatWorldJoinDataList ?? []}
        photoPathList={photoPathList ?? []}
        photoWidth={props.photoWidth}
        gapWidth={props.gapWidth}
        onSelectPhotoFileName={props.onSelectPhotoFileName}
      />
    </div>
  );
};
