import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import { useState } from 'react';
import { PhotoListByYearMonth } from './PhotoListByYearMonth';
import * as hooks from './hooks';
import { usePhotoArea } from './usePhotoArea';

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
  (index: number): number => {
    const overrided = input.overridedComponentHeight.find(
      (item) => item.index === index,
    );
    console.log('getEstimateSizeFn', index, input);
    const estimated = (input.countByYearMonthList[index]?.areaHeight || 0) + 56;
    if (overrided) {
      console.log(`estimated: ${estimated}, overrided: ${overrided.height}`);
      return overrided.height;
    }
    return estimated;
  };

interface PhotoListProps {
  onSelectPhotoFileName: (fileName: string) => void;
  photoColumnCount: number;
}
const PhotoList = ({
  onSelectPhotoFileName,
  photoColumnCount,
}: PhotoListProps) => {
  console.log('PhotoList');
  const gapWidth = 4;
  const overridedComponentHeight = useRef<
    {
      index: number;
      height: number;
    }[]
  >([]);

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

  const [getEstimateSize, _setGetEstimateSize] = React.useState<
    ((index: number) => number) | undefined
  >(undefined);

  const usePhotoAreaInput = useRef({
    componentWidth: 0,
    columnCount: photoColumnCount,
    gapWidth,
  });

  const { reclaim: _reclaim } = usePhotoArea({
    input: usePhotoAreaInput.current,
    onSuccess: (data) => {
      console.log('usePhotoArea onSuccess');
      setPhotoAreaList(data);
      _setGetEstimateSize(() =>
        getEstimateSizeFn({
          overridedComponentHeight: overridedComponentHeight.current,
          countByYearMonthList: data.countByYearMonthList,
        }),
      );
      rowVirtualizer.measure();
    },
  });

  const reclaimPhotoArea = (props: Parameters<typeof _reclaim>[0]) => {
    console.log('reclaimPhotoArea', props);
    _reclaim(props);
  };

  // バーチャルスクロール
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollAreaContentRef = React.useRef<HTMLDivElement | null>(null);
  hooks.useComponentWidth({
    ref: scrollAreaContentRef,
    onChange: (width) => {
      console.log('useComponentWidth onChange');
      usePhotoAreaInput.current.componentWidth = width;
      reclaimPhotoArea(usePhotoAreaInput.current);
    },
  });

  // columnCount変更時
  React.useEffect(() => {
    console.log('useEffect photoColumnCount');
    usePhotoAreaInput.current.columnCount = photoColumnCount;
    reclaimPhotoArea(usePhotoAreaInput.current);
  }, [photoColumnCount]);

  const rowVirtualizer = useVirtualizer({
    count: photoAreaList?.len || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const size = getEstimateSize ? getEstimateSize(index) : 3000;
      console.log(`index${index}: estimateSize: ${size}`);
      return size;
    },
    gap: 8,
    overscan: 1,
  });

  const onChangeComponentHeight = (height: number, virtualRowIndex: number) => {
    const indexIfExists = overridedComponentHeight.current.findIndex(
      (item) => item.index === virtualRowIndex,
    );
    if (indexIfExists === -1) {
      overridedComponentHeight.current.push({ index: virtualRowIndex, height });
    } else {
      overridedComponentHeight.current[indexIfExists] = {
        index: virtualRowIndex,
        height,
      };
    }
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
                    onSelectPhotoFileName={onSelectPhotoFileName}
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

interface PhotoListAllProps {
  onSelectPhotoFileName: (fileName: string) => void;
  photoColumnCount: number;
}
export const PhotoListAll = ({
  onSelectPhotoFileName,
  photoColumnCount,
}: PhotoListAllProps) => {
  console.log('PhotoListAll');

  const renderContent = () => {
    console.log('renderContent');
    return (
      <>
        <PhotoList
          onSelectPhotoFileName={onSelectPhotoFileName}
          photoColumnCount={photoColumnCount}
        />
      </>
    );
  };

  return <div className="h-full w-full relative">{renderContent()}</div>;
};
