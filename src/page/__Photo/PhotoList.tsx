import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';
import { useState } from 'react';
import { PhotoListByYearMonth } from './PhotoListByYearMonth';
import * as hooks from './hooks';
import { usePhotoArea } from './ usePhotoArea';

const PhotoList = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
}) => {
  console.log('PhotoList');

  const [componentWidth, setComponentWidth] = useState<number | undefined>(
    undefined,
  );
  const gapWidth = 4;
  const { data: photoAreaList } = usePhotoArea({
    input: {
      componentWidth,
      gapWidth,
    },
    onSuccess: () => {
      rowVirtualizer.measure();
    },
  });

  // バーチャルスクロール
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollAreaContentRef = React.useRef<HTMLDivElement | null>(null);
  hooks.useComponentWidth({
    ref: scrollAreaContentRef,
    onChange: (width) => {
      setComponentWidth(width);
    },
  });
  const rowVirtualizer = useVirtualizer({
    count: photoAreaList?.len || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getEstimateSize(index),
    overscan: 0,
  });

  const [overridedComponentHeight, setOverridedComponentHeight] = useState<
    {
      index: number;
      height: number;
    }[]
  >([]);
  const getEstimateSize = React.useCallback(
    (index: number) => {
      const overrided = overridedComponentHeight.find(
        (item) => item.index === index,
      );
      const estimated =
        (photoAreaList?.countByYearMonthList[index].areaHeight || 0) + 56;
      if (overrided && estimated < overrided.height) {
        console.log(`estimated: ${estimated}, overrided: ${overrided.height}`);
        return overrided.height;
      }
      return estimated;
    },
    [overridedComponentHeight],
  );

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
            className="flex-wrap flex top-0 left-0 w-full absolute"
          >
            {(() => {
              const countByYearMonth =
                photoAreaList.countByYearMonthList[virtualRow.index];
              const { photoTakenYear, photoTakenMonth, photoWidth } =
                countByYearMonth;
              return (
                <div
                  key={`${photoTakenYear}-${photoTakenMonth}`}
                  className="flex flex-col w-full space-y-8"
                >
                  <PhotoListByYearMonth
                    onSelectPhotoFileName={props.onSelectPhotoFileName}
                    onChangeComponentHeight={(height) => {
                      setOverridedComponentHeight([
                        { index: virtualRow.index, height },
                        ...overridedComponentHeight,
                      ]);
                    }}
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
