import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import { useState } from 'react';
import { PhotoListByYearMonth } from './PhotoListByYearMonth';
import * as hooks from './hooks';
import { usePhotoArea } from './ usePhotoArea';

const getEstimateSizeFn =
  (input: {
    overridedComponentHeight: {
      index: number;
      height: number;
    }[];
    countByYearMonthList: {
      photoTakenYear: number;
      photoTakenMonth: number;
      photoCount: number;
      areaHeight: number;
      columnCount: number;
      rowCount: number;
      photoWidth: number;
    }[];
  }) =>
  (index: number) => {
    const overrided = input.overridedComponentHeight.find(
      (item) => item.index === index,
    );
    const estimated = (input.countByYearMonthList[index]?.areaHeight || 0) + 56;
    if (overrided && estimated < overrided.height) {
      console.log(`estimated: ${estimated}, overrided: ${overrided.height}`);
      return overrided.height;
    }
    return estimated;
  };

const PhotoList = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
}) => {
  console.log('PhotoList');
  const [componentWidth, setComponentWidth] = useState<number | undefined>(
    undefined,
  );
  const [photoAreaList, setPhotoAreaList] = useState<{
    countByYearMonthList: {
      photoTakenYear: number;
      photoTakenMonth: number;
      photoCount: number;
      areaHeight: number;
      columnCount: number;
      rowCount: number;
      photoWidth: number;
    }[];
    len: number;
  } | null>(null);
  const gapWidth = 4;

  const [getEstimateSize, _setGetEstimateSize] = React.useState<
    ((index: number) => number) | undefined
  >(undefined);
  const overridedComponentHeight = useRef<
    {
      index: number;
      height: number;
    }[]
  >([]);
  const setGetEstimateSize = () => {
    _setGetEstimateSize(() =>
      getEstimateSizeFn({
        overridedComponentHeight: overridedComponentHeight.current,
        countByYearMonthList: photoAreaList?.countByYearMonthList || [],
      }),
    );
    console.log('setGetEstimateSize', 'getEstimateSize', getEstimateSize);
    rowVirtualizer.measure();
  };

  usePhotoArea({
    input: {
      componentWidth,
      gapWidth,
    },
    onSuccess: (data) => {
      console.log('usePhotoArea onSuccess');
      setPhotoAreaList(data);
      setGetEstimateSize();
    },
  });

  // バーチャルスクロール
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollAreaContentRef = React.useRef<HTMLDivElement | null>(null);
  hooks.useComponentWidth({
    ref: scrollAreaContentRef,
    onChange: (width) => {
      setComponentWidth(width);
      setGetEstimateSize();
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: photoAreaList?.len || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      return getEstimateSize ? getEstimateSize(index) : 0;
    },
    gap: 8,
    overscan: 1,
  });

  const onChangeComponentHeight = (height: number, virtualRowIndex: number) => {
    overridedComponentHeight.current = [
      { index: virtualRowIndex, height },
      ...overridedComponentHeight.current,
    ];
    setGetEstimateSize();
  };

  const content = () => {
    if (photoAreaList === null) {
      return null;
    }
    return (
      <>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              justifyContent: 'flex-start',
            }}
            className="flex-wrap flex top-0 left-0 w-full absolute gap-8"
          >
            {(() => {
              const countByYearMonth =
                photoAreaList.countByYearMonthList[virtualRow.index];
              const { photoTakenYear, photoTakenMonth, photoWidth } =
                countByYearMonth;
              return (
                <div
                  key={`${photoTakenYear}-${photoTakenMonth}`}
                  className="flex flex-col w-full PhotoListByYearMonthWrapper"
                >
                  <PhotoListByYearMonth
                    onSelectPhotoFileName={props.onSelectPhotoFileName}
                    onChangeComponentHeight={(height) =>
                      onChangeComponentHeight(height, virtualRow.index)
                    }
                    photoTakenYear={photoTakenYear}
                    photoTakenMonth={photoTakenMonth}
                    photoWidth={photoWidth}
                    gapWidth={gapWidth}
                  />
                </div>
              );
            })()}
          </div>
        ))}
      </>
    );
  };

  return (
    <div ref={parentRef} className="h-full overflow-y-auto relative">
      <div
        ref={scrollAreaContentRef}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'absolute',
        }}
      >
        {content()}
      </div>
    </div>
  );
};

PhotoList.whyDidYouRender = true;

export const PhotoListAll = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
}) => {
  console.log('PhotoListAll');

  const renderContent = () => {
    console.log('renderContent');
    return <PhotoList onSelectPhotoFileName={props.onSelectPhotoFileName} />;
  };

  return <div className="h-full w-full relative">{renderContent()}</div>;
};
