import React from 'react';

import { trpcReact } from '@/trpc';
import { PhotoByPath } from '@/v1/components/ui/PhotoByPath';
import { Badge } from '@/v1/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/v1/components/ui/context-menu';
import { Label } from '@/v1/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/v1/components/ui/tooltip';
import * as dateFns from 'date-fns';
import { Globe, Image, Search } from 'lucide-react';
import * as pathe from 'pathe';
import { RenderInView } from './RenderInView';
import * as composables from './_PhotoListByYearMonth/composables';
import * as hooks from './hooks';

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
  const grouped = composables.groupPhotosByWorldJoin(
    props.vrchatWorldJoinDataList,
    props.photoPathList,
  );
  const { mutate: copyImageDataByPath } =
    trpcReact.electronUtil.copyImageDataByPath.useMutation();
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
              <ContextMenu>
                <ContextMenuTrigger>
                  <TooltipProvider key={photo.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          style={{
                            width: props.photoWidth,
                            height: props.photoWidth,
                          }}
                        >
                          <RenderInView className="h-full w-full" delay={200}>
                            <PhotoByPathRevalidateOnPathNotFound
                              className="h-full w-full cursor-pointer hover:brightness-105"
                              photoPath={photo.photoPath}
                              onClick={() =>
                                props.onSelectPhotoFileName(photo.photoPath)
                              }
                            />
                          </RenderInView>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{pathe.parse(photo.photoPath).name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      copyImageDataByPath(photo.photoPath);
                    }}
                  >
                    Copy Image
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
