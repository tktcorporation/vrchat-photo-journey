import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useMemo } from 'react';
import { useState } from 'react';
import { PhotoListByYearMonth } from './PhotoListByYearMonth';
import * as hooks from './hooks';

const PhotoList = (props: {
  onSelectPhotoFileName: (fileName: string) => void;
}) => {
  console.log('PhotoList');

  const scrollAreaContentRef = React.useRef<HTMLDivElement | null>(null);
  const componentWidth = hooks.useComponentWidth(scrollAreaContentRef);
  console.log(`componentWidth: ${componentWidth}`);
  const gapWidth = 4;
  const photoAreaList = hooks.usePhotoArea({
    componentWidth,
    gapWidth,
  });

  const [overridedComponentHeight, setOverridedComponentHeight] = useState<
    {
      index: number;
      height: number;
    }[]
  >([]);
  const getEstimateSize = (index: number) => {
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
  };

  // バーチャルスクロール
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: photoAreaList?.len || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getEstimateSize(index),
    overscan: 0,
  });

  useMemo(() => {
    // countByYearMonthList の変更をトリガーに再レンダリングを促す
    console.log('measure');
    rowVirtualizer.measure();
  }, [photoAreaList?.countByYearMonthList, overridedComponentHeight]);

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
                photoAreaList.countByYearMonthList[virtualRow.index];
              const { photoTakenYear, photoTakenMonth, photoWidth } =
                countByYearMonth;
              return (
                <div
                  key={`${photoTakenYear}-${photoTakenMonth}`}
                  className="flex flex-col w-full"
                >
                  <PhotoListByYearMonth
                    onSelectPhotoFileName={props.onSelectPhotoFileName}
                    onChangeComponentHeight={(height) => {
                      setOverridedComponentHeight((prev) => [
                        { index: virtualRow.index, height },
                        ...prev,
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
