import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { P, match } from 'ts-pattern';

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

interface CalculateArgs {
  countByYearMonthList?: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
  }[];
  componentWidth?: number;
  gapWidth: number;
}
const calculatePhotoArea = (
  args: CalculateArgs,
): {
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
  if (args.countByYearMonthList === undefined) {
    return null;
  }
  if (args.componentWidth === undefined) {
    return null;
  }

  const photoWidth = args.componentWidth
    ? getPhotoWidth(args.componentWidth, args.gapWidth)
    : 100;

  const result: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
    areaHeight: number;
    columnCount: number;
    rowCount: number;
    photoWidth: number;
  }[] = [];
  for (const countByYearMonth of args.countByYearMonthList) {
    const columnCount = Math.floor(args.componentWidth / photoWidth);
    const rowCount = Math.ceil(countByYearMonth.photoCount / columnCount);
    const areaHeight = rowCount * photoWidth + (rowCount - 1) * args.gapWidth;
    result.push({
      ...countByYearMonth,
      areaHeight,
      columnCount,
      rowCount,
      photoWidth,
    });
  }
  return {
    len: args.countByYearMonthList.length,
    countByYearMonthList: result,
  };
};

// 各セクションの領域の高さ、写真の幅、高さを計算するhook
type UsePhotoAreaResult = null | {
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
};
interface UsePhotoAreaInput {
  componentWidth: number | undefined;
  gapWidth: number;
}
export const usePhotoArea = (props: {
  input: UsePhotoAreaInput;
  onSuccess?: (data: UsePhotoAreaResult) => void;
}): {
  data: UsePhotoAreaResult;
  reclaim: (input: UsePhotoAreaInput) => void;
} => {
  const { data: countByYearMonthList } =
    trpcReact.vrchatPhoto.getCountByYearMonthList.useQuery();

  const [resultUsePhotoArea, _setResultUsePhotoArea] =
    useState<UsePhotoAreaResult>(null);
  const setResultUsePhotoArea = (data: UsePhotoAreaResult) => {
    _setResultUsePhotoArea(data);
    props.onSuccess?.(data);
  };

  const calculatePhotoAreaResult = useMemo(() => {
    console.log('calculatePhotoAreaResult');
    return calculatePhotoArea({
      countByYearMonthList,
      componentWidth: props.input.componentWidth,
      gapWidth: props.input.gapWidth,
    });
  }, [countByYearMonthList, props.input.componentWidth, props.input.gapWidth]);

  useEffect(() => {
    console.log('setResultUsePhotoArea');
    setResultUsePhotoArea(calculatePhotoAreaResult);
  }, [countByYearMonthList, props.input.componentWidth, props.input.gapWidth]);

  const reclaim = useCallback(
    (input: UsePhotoAreaInput) => {
      console.log('reclaim');
      setResultUsePhotoArea(
        calculatePhotoArea({
          countByYearMonthList,
          componentWidth: input.componentWidth,
          gapWidth: input.gapWidth,
        }),
      );
    },
    [countByYearMonthList],
  );

  console.log(`usePhotoArea componentWidth: ${props.input.componentWidth}`);
  console.log(resultUsePhotoArea);
  return {
    data: resultUsePhotoArea,
    reclaim,
  };
};
