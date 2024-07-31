import React, { useEffect, useMemo } from 'react';

import { PhotoByPath } from '@/components/ui/PhotoByPath';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { trpcReact } from '@/trpc';
import * as dateFns from 'date-fns';
import { Globe, Image, Search } from 'lucide-react';
import { RenderInView } from './RenderInView';
import * as hooks from './hooks';

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
  const componentHeight = hooks.useComponentHeight(rootRef);
  useMemo(() => {
    if (componentHeight) {
      props.onChangeComponentHeight(componentHeight);
    }
  }, [componentHeight, !!rootRef]);

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

  return (
    <div ref={rootRef}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center space-x-2">
          <Globe size={20} />
          <Badge>{`${props.photoTakenYear}年${props.photoTakenMonth}月`}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Image size={20} />
          <Badge>{`${photoPathList?.length}枚`}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap" style={{ gap: `${props.gapWidth}px` }}>
        {photoPathList?.map((photoPath, index, arr) => {
          const prevDate = index > 0 ? arr[index - 1].photoTakenAt : undefined;
          const currentDate = photoPath.photoTakenAt;
          // 日付が変わっていたらTrue
          const isDateChanged = prevDate
            ? !dateFns.isSameDay(prevDate, currentDate)
            : true;

          return (
            <>
              {isDateChanged && (
                <div className="w-full">
                  <Label>{dateFns.format(currentDate, 'yyyy/MM/dd (E)')}</Label>
                </div>
              )}
              <div
                key={photoPath.id}
                style={{
                  width: props.photoWidth,
                  height: props.photoWidth,
                }}
              >
                <RenderInView className="h-full w-full" delay={200}>
                  <PhotoByPathRevalidateOnPathNotFound
                    className="h-full w-full cursor-pointer hover:brightness-105"
                    photoPath={photoPath.photoPath}
                    onClick={() =>
                      props.onSelectPhotoFileName(photoPath.photoPath)
                    }
                  />
                </RenderInView>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
};