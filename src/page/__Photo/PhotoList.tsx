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
import { useComponentWidth } from './hooks';

// 各セクションの領域の高さ、写真の幅、高さを計算するhook
const usePhotoArea = (componentWidth: number | undefined) => {
  const { data: countByYearMonthList } =
    trpcReact.vrchatPhoto.getCountByYearMonthList.useQuery();

  // 写真のサイズもコンポーネントの横幅によって動的に決定する
  const photoWidth = match(componentWidth)
    .with(P.number.lte(400), () => 100)
    .with(P.number.lte(800), () => 200)
    .otherwise(() => 300);

  const [resultByYearMonth, setResultByYearMonth] = useState<{
    len: number;
    countByYearMonthList: {
      photoTakenYear: number;
      photoTakenMonth: number;
      photoCount: number;
      areaHeight: number;
      columnCount: number;
      rowCount: number;
      photoWidth: number;
    }[];
  } | null>(null);

  const result: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
    areaHeight: number;
    columnCount: number;
    rowCount: number;
    photoWidth: number;
  }[] = [];

  useMemo(() => {
    if (countByYearMonthList === undefined) {
      setResultByYearMonth(null);
      return null;
    }
    if (componentWidth === undefined) {
      setResultByYearMonth(null);
      return null;
    }
    setResultByYearMonth({
      len: countByYearMonthList.length,
      countByYearMonthList: result,
    });
  }, [countByYearMonthList, componentWidth, photoWidth]);

  console.log(`componentWidth: ${componentWidth}`);

  if (countByYearMonthList === undefined) {
    return null;
  }
  if (componentWidth === undefined) {
    return null;
  }

  for (const countByYearMonth of countByYearMonthList) {
    const columnCount = Math.floor(componentWidth / photoWidth);
    const rowCount = Math.ceil(countByYearMonth.photoCount / columnCount);
    const areaHeight = rowCount * photoWidth;
    result.push({
      ...countByYearMonth,
      areaHeight,
      columnCount,
      rowCount,
      photoWidth,
    });
  }
  console.log(resultByYearMonth);
  return resultByYearMonth;
};

const PhotoList = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
  len: number;
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
  const currentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: props.len,
    getScrollElement: () => currentRef.current,
    estimateSize: (index) => props.countByYearMonthList[index].areaHeight + 56,
    overscan: 2,
  });

  useMemo(() => {
    // countByYearMonthList の変更をトリガーに再レンダリングを促す
    rowVirtualizer.measure();
  }, [props.countByYearMonthList]);

  return (
    <div
      ref={currentRef}
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'absolute',
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
                />
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
};

const PhotoListYearMonth = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
  photoTakenYear: number;
  photoTakenMonth: number;
  photoWidth: number;
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
    <div className="flex flex-wrap">
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
              <PhotoByPath
                alt={photoPath}
                objectFit="cover"
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
  const componentWidth = useComponentWidth(currentRef);
  console.log(`componentWidth: ${componentWidth}`);
  const photoAreaList = usePhotoArea(componentWidth);

  const renderContent = () => {
    if (photoAreaList === null) {
      return null;
    }

    return (
      <ScrollArea className="h-full absolute overflow-y-auto">
        <PhotoList
          onSelectPhotoFileName={props.onSelectPhotoFileName}
          len={photoAreaList.len}
          countByYearMonthList={photoAreaList.countByYearMonthList}
        />
      </ScrollArea>
    );
  };

  return (
    <div className="h-full w-full relative" ref={currentRef}>
      {renderContent()}
    </div>
  );
};
