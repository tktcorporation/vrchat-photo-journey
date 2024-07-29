import React, { useEffect, useMemo } from 'react';

import { PhotoByPath } from '@/components/ui/PhotoByPath';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { trpcReact } from '@/trpc';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as dateFns from 'date-fns';
import { Globe, Image, Search } from 'lucide-react';
import * as path from 'pathe';
import { useState } from 'react';
import { P, match } from 'ts-pattern';
import { RenderInView } from './RenderInView';
import { VRChatWorldJoinDataView } from './VRChatJoinDataView';
import * as hooks from './hooks';

const PhotoList = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
  len: number;
  gapWidth: number;
  countByYearMonthList: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
    areaHeight: number;
    columnCount: number;
    rowCount: number;
    photoWidth: number;
  }[];
}) => {
  console.log('PhotoList');
  console.log(props);
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: props.len,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => props.countByYearMonthList[index].areaHeight + 56,
    overscan: 0,
  });

  useMemo(() => {
    // countByYearMonthList の変更をトリガーに再レンダリングを促す
    console.log('measure');
    rowVirtualizer.measure();
  }, [props.countByYearMonthList]);

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              justifyContent: 'flex-start',
            }}
            className="flex-wrap flex"
          >
            {(() => {
              const countByYearMonth =
                props.countByYearMonthList[virtualRow.index];
              const {
                photoTakenYear,
                photoTakenMonth,
                photoCount,
                photoWidth,
                rowCount,
              } = countByYearMonth;
              return (
                <div
                  key={`${photoTakenYear}-${photoTakenMonth}`}
                  className="flex flex-col w-full"
                  style={{
                    height: `${rowCount * photoWidth}px`,
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Globe size={20} />
                      <Badge>{`${photoTakenYear}年${photoTakenMonth}月`}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image size={20} />
                      <Badge>{`${photoCount}枚`}</Badge>
                    </div>
                  </div>
                  <PhotoListYearMonth
                    onSelectPhotoFileName={props.onSelectPhotoFileName}
                    photoTakenYear={photoTakenYear}
                    photoTakenMonth={photoTakenMonth}
                    photoWidth={photoWidth}
                    gapWidth={props.gapWidth}
                  />
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

PhotoList.whyDidYouRender = true;

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

const PhotoListYearMonth = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
  photoTakenYear: number;
  photoTakenMonth: number;
  photoWidth: number;
  gapWidth: number;
}) => {
  // 月初
  const startOfMonth = dateFns.startOfMonth(
    new Date(props.photoTakenYear, props.photoTakenMonth - 1),
  );
  // 次の月初
  const endOfMonth = dateFns.startOfMonth(dateFns.addMonths(startOfMonth, 1));
  const { data: photoPathList } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathList.useQuery({
      gtPhotoTakenAt: startOfMonth,
      ltPhotoTakenAt: endOfMonth,
      orderByPhotoTakenAt: 'desc',
    });
  return (
    <div className="flex flex-wrap" style={{ gap: `${props.gapWidth}px` }}>
      {/* TODO: 日付ごとにグルーピング */}
      {photoPathList?.map((photoPath) => {
        return (
          <div
            key={photoPath}
            className="w-full h-full"
            style={{
              width: props.photoWidth,
              height: props.photoWidth,
            }}
          >
            <RenderInView className="h-full w-full" delay={200}>
              <PhotoByPathRevalidateOnPathNotFound
                className="h-full w-full cursor-pointer hover:brightness-105"
                photoPath={photoPath}
                onClick={() => props.onSelectPhotoFileName(photoPath)}
              />
            </RenderInView>
          </div>
        );
      })}
    </div>
  );
};

export const PhotoListAll = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
}) => {
  console.log('PhotoListAll');
  // component の横幅
  const currentRef = React.useRef<HTMLDivElement | null>(null);
  // component の横幅
  const componentWidth = hooks.useComponentWidth(currentRef);
  console.log(`componentWidth: ${componentWidth}`);
  const gapWidth = 4;
  const photoAreaList = hooks.usePhotoArea({
    componentWidth,
    gapWidth,
  });

  const renderContent = () => {
    console.log('renderContent');
    if (photoAreaList === null) {
      return null;
    }

    return (
      <PhotoList
        onSelectPhotoFileName={props.onSelectPhotoFileName}
        len={photoAreaList.len}
        countByYearMonthList={photoAreaList.countByYearMonthList}
        gapWidth={gapWidth}
      />
    );
  };

  return (
    <div className="h-full w-full relative" ref={currentRef}>
      {renderContent()}
    </div>
  );
};
