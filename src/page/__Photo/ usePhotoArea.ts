import { trpcReact } from '@/trpc';
import * as neverthrow from 'neverthrow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  countByYearMonthList: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
  }[];
  componentWidth: number;
  gapWidth: number;
}
const calculatePhotoArea = (
  args: CalculateArgs,
): neverthrow.Result<
  {
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
  },
  'COMPONENT_WIDTH_IS_UNDEFINED_OR_ZERO'
> => {
  if (args.componentWidth === undefined || args.componentWidth === 0) {
    return neverthrow.err('COMPONENT_WIDTH_IS_UNDEFINED_OR_ZERO');
  }
  const photoWidth = getPhotoWidth(args.componentWidth, args.gapWidth);

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
  return neverthrow.ok({
    len: args.countByYearMonthList.length,
    countByYearMonthList: result,
  });
};

// 各セクションの領域の高さ、写真の幅、高さを計算するhook
type UsePhotoAreaResult = {
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
  componentWidth: number;
  gapWidth: number;
}
export const usePhotoArea = (props: {
  input: UsePhotoAreaInput;
  onSuccess?: (data: UsePhotoAreaResult) => void;
}): {
  data: UsePhotoAreaResult | null;
  reclaim: (input: UsePhotoAreaInput) => void;
} => {
  const usePhotoAreaInput = useRef<UsePhotoAreaInput>(props.input);

  const [resultUsePhotoArea, _setResultUsePhotoArea] =
    useState<UsePhotoAreaResult | null>(null);
  const setResultUsePhotoArea = (data: UsePhotoAreaResult) => {
    _setResultUsePhotoArea(data);
    console.log('usePhotoArea onSuccess', data, resultUsePhotoArea);
    props.onSuccess?.(data);
  };

  const countByYearMonthList = useRef<
    | {
        photoTakenYear: number;
        photoTakenMonth: number;
        photoCount: number;
      }[]
    | undefined
  >(undefined);
  trpcReact.vrchatPhoto.getCountByYearMonthList.useQuery(undefined, {
    onSuccess: (data) => {
      countByYearMonthList.current = data;
      const photoArea = calculatePhotoArea({
        countByYearMonthList: data,
        componentWidth: usePhotoAreaInput.current.componentWidth,
        gapWidth: usePhotoAreaInput.current.gapWidth,
      });
      if (photoArea.isErr()) {
        console.log(
          'setResultUsePhotoArea is skipped: calculatePhotoArea failed',
        );
        return;
      }
      console.log('setResultUsePhotoArea', photoArea.value);
      setResultUsePhotoArea(photoArea.value);
    },
  });

  const reclaim = (input: UsePhotoAreaInput) => {
    console.log('reclaim');
    usePhotoAreaInput.current = input;
    if (countByYearMonthList.current === undefined) {
      console.log(
        'setResultUsePhotoArea is skipped: countByYearMonthList is undefined',
      );
      return;
    }
    const photoArea = calculatePhotoArea({
      countByYearMonthList: countByYearMonthList.current,
      componentWidth: input.componentWidth,
      gapWidth: input.gapWidth,
    });
    if (photoArea.isErr()) {
      console.log(
        'setResultUsePhotoArea is skipped: calculatePhotoArea failed',
      );
      return;
    }
    setResultUsePhotoArea(photoArea.value);
  };

  return {
    data: resultUsePhotoArea,
    reclaim,
  };
};
