import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';
import { AppRouter } from 'electron/api';
import { useEffect, useMemo, useState } from 'react';

type YearMonth = {
  year: string;
  month: string;
};

export const useYearMonthList = () => {
  console.log('useYearMonthList');
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
  console.log('selectedFolderYearMonth', selectedFolderYearMonth);
  const [photoItemList, setPhotoItemList] =
    useState<
      inferProcedureOutput<
        AppRouter['getVRChatPhotoWithWorldIdAndDate']
      >['data']
    >();
  const [photoItemFetchError, setPhotoItemFetchError] =
    useState<
      inferProcedureOutput<
        AppRouter['getVRChatPhotoWithWorldIdAndDate']
      >['error']
    >(null);

  const photoItemListQuery =
    trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery(
      selectedFolderYearMonth,
      {
        enabled: !!(
          selectedFolderYearMonth.year && selectedFolderYearMonth.month
        ),
      },
    );

  const sortedPhotoItems = useMemo(() => {
    if (!photoItemListQuery.data?.data) {
      return [];
    }

    return [...photoItemListQuery.data.data].sort((a, b) => {
      const datetimeA =
        a.datetime.date.year +
        a.datetime.date.month +
        a.datetime.date.day +
        a.datetime.time.hour +
        a.datetime.time.minute +
        a.datetime.time.second +
        a.datetime.time.millisecond;
      const datetimeB =
        b.datetime.date.year +
        b.datetime.date.month +
        b.datetime.date.day +
        b.datetime.time.hour +
        b.datetime.time.minute +
        b.datetime.time.second +
        b.datetime.time.millisecond;
      return datetimeB.localeCompare(datetimeA);
    });
  }, [photoItemListQuery.data?.data]);

  useEffect(() => {
    setPhotoItemList(sortedPhotoItems);
    setPhotoItemFetchError(photoItemListQuery.data?.error ?? null);
  }, [sortedPhotoItems, photoItemListQuery.data?.error]);

  const refetchPhotoItemList = () => photoItemListQuery.refetch();

  return {
    photoItemList,
    setPhotoItemList,
    photoItemFetchError,
    refetchPhotoItemList,
  };
};
