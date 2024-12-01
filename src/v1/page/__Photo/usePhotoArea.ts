import { trpcReact } from '@/trpc';
import * as neverthrow from 'neverthrow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { P, match } from 'ts-pattern';

const getPhotoWidth = (
  componentWidth: number,
  columnCount: number,
  gapWidth: number,
) => {
  // カラム数が0以下にならないようにエラーハンドリング
  if (columnCount <= 0) {
    throw new Error('Column count must be greater than zero');
  }

  // 写真の幅をカラム数とギャップから計算し、gapも含めた合計がcomponentWidthにぴったり収まるようにする
  return (componentWidth - gapWidth * (columnCount - 1)) / columnCount;
};

interface CalculateArgs {
  countByYearMonthList: {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
  }[];
  componentWidth: number;
  columnCount: number;
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

  // 写真の幅を計算
  const photoWidth = getPhotoWidth(
    args.componentWidth,
    args.columnCount,
    args.gapWidth,
  );

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
    // カラム数に基づいて必要な行数を計算
    const rowCount = Math.ceil(countByYearMonth.photoCount / args.columnCount);

    // 各行に写真が並ぶ際の高さを計算
    // 各行の高さは写真の幅（正方形のため高さも同じ）で計算し、
    // 行間のギャップも含めて全体の高さを算出
    const areaHeight = rowCount * photoWidth + (rowCount - 1) * args.gapWidth;

    result.push({
      ...countByYearMonth,
      areaHeight, // 全ての写真が収まるためのセクション全体の高さ
      columnCount: args.columnCount, // 指定されたカラム数
      rowCount, // 必要な行数
      photoWidth, // 写真の幅（正方形のため高さも同じ）
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
  columnCount: number;
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
        columnCount: usePhotoAreaInput.current.columnCount,
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
      columnCount: input.columnCount,
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
