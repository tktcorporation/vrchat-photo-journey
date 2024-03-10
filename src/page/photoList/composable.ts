import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from 'electron/api';
import { useEffect, useMemo, useState } from 'react';

type YearMonth = {
  year: string;
  month: string;
};

export const useYearMonthList = () => {
  const { data: yearMonthList, refetch: refetchYearMonthList } =
    trpcReact.getVRChatPhotoFolderYearMonthList.useQuery();
  const sortedYearMonthList = yearMonthList?.sort((a, b) => {
    const yearMonthA = a.year + a.month;
    const yearMonthB = b.year + b.month;
    return yearMonthB.localeCompare(yearMonthA);
  });

  const firstYearMonth = useMemo(() => {
    return sortedYearMonthList?.[0] ?? { year: '', month: '' };
  }, [sortedYearMonthList]);

  return {
    yearMonthList,
    sortedYearMonthList,
    firstYearMonth,
    refetchYearMonthList,
  };
};

export const usePhotoItems = (selectedFolderYearMonth: YearMonth) => {
  const [photoItemList, setPhotoItemList] =
    useState<
      inferProcedureOutput<
        AppRouter['getVRChatJoinInfoWithVRChatPhotoList']
      >['data']
    >();

  const [photoItemFetchError, setPhotoItemFetchError] =
    useState<
      inferProcedureOutput<
        AppRouter['getVRChatJoinInfoWithVRChatPhotoList']
      >['error']
    >(null);

  const photoItemListQuery =
    trpcReact.getVRChatJoinInfoWithVRChatPhotoList.useQuery(
      selectedFolderYearMonth,
      {
        enabled: !!(
          selectedFolderYearMonth.year && selectedFolderYearMonth.month
        ),
      },
    );

  useEffect(() => {
    setPhotoItemList(photoItemListQuery.data?.data);
    setPhotoItemFetchError(photoItemListQuery.data?.error ?? null);
  }, [photoItemListQuery.data?.data, photoItemListQuery.data?.error]);

  const refetchPhotoItemList = () => photoItemListQuery.refetch();

  return {
    photoItemList,
    setPhotoItemList,
    photoItemFetchError,
    refetchPhotoItemList,
  };
};
