import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { P, match } from 'ts-pattern';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type CallbackFunction = (...args: any[]) => void;

const useDebouncedCallback = <T extends CallbackFunction>(
  callback: T,
  delay: number,
): T => {
  const timeoutRef = useRef<number | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;

  return debouncedCallback;
};

export const useComponentWidth = (
  ref: React.RefObject<HTMLDivElement>,
): number | undefined => {
  const [width, setWidth] = useState<number>();
  const observer = useRef<ResizeObserver | null>(null);

  const handleResize = useDebouncedCallback(
    (entries: ReadonlyArray<ResizeObserverEntry>) => {
      if (entries[0]?.contentRect) {
        setWidth(entries[0].contentRect.width);
      }
    },
    100,
  );

  useEffect(() => {
    if (ref.current) {
      observer.current = new ResizeObserver(handleResize);
      observer.current.observe(ref.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [ref, handleResize]);

  return width;
};

// 各セクションの領域の高さ、写真の幅、高さを計算するhook
export const usePhotoArea = (props: {
  componentWidth: number | undefined;
  gapWidth: number;
}): {
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
} | null => {
  const { data: countByYearMonthList } =
    trpcReact.vrchatPhoto.getCountByYearMonthList.useQuery();

  const getPhotoWidth = (componentWidth: number, gapWidth: number) => {
    // 写真のサイズもコンポーネントの横幅によって動的に決定する
    const photoWidthMax = match(componentWidth)
      .with(P.number.lte(400), () => 100)
      .with(P.number.lte(800), () => 150)
      .otherwise(() => 200);

    // そのままおいたときに最大何枚写真が並ぶか
    const columnCountMax = Math.floor(
      componentWidth / (photoWidthMax + gapWidth),
    );

    // カラム数が0にならないようにエラーハンドリング
    if (columnCountMax === 0) {
      return photoWidthMax;
    }

    // 残りの幅
    const restWidth =
      componentWidth - columnCountMax * (photoWidthMax + gapWidth);

    // 残りの幅を埋めるために必要な写真の幅
    const photoWidthAdditional = restWidth / columnCountMax;

    // 合計幅がcomponentWidthになるように調整された写真の幅
    let adjustedPhotoWidth = photoWidthMax + photoWidthAdditional;

    // 調整後の写真幅を使用して計算された合計幅
    const totalWidth = columnCountMax * (adjustedPhotoWidth + gapWidth);

    // 調整後の写真幅が合計幅と一致しない場合、調整を再計算
    if (totalWidth !== componentWidth) {
      adjustedPhotoWidth =
        (componentWidth - gapWidth * (columnCountMax - 1)) / columnCountMax;
    }

    return adjustedPhotoWidth;
  };

  const photoWidth = props.componentWidth
    ? getPhotoWidth(props.componentWidth, props.gapWidth)
    : 100;

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
    if (props.componentWidth === undefined) {
      setResultByYearMonth(null);
      return null;
    }
    setResultByYearMonth({
      len: countByYearMonthList.length,
      countByYearMonthList: result,
    });
  }, [countByYearMonthList, props.componentWidth, photoWidth]);

  console.log(`componentWidth: ${props.componentWidth}`);

  if (countByYearMonthList === undefined) {
    return null;
  }
  if (props.componentWidth === undefined) {
    return null;
  }

  for (const countByYearMonth of countByYearMonthList) {
    const columnCount = Math.floor(props.componentWidth / photoWidth);
    const rowCount = Math.ceil(countByYearMonth.photoCount / columnCount);
    const areaHeight = rowCount * photoWidth + (rowCount - 1) * props.gapWidth;
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
