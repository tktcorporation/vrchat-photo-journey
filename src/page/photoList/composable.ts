import { trpcReact } from '@/trpc';
import type { inferProcedureOutput } from '@trpc/server';
import { AppRouter } from 'electron/api';
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

// export const usePhotoItems = (selectedFolderYearMonth: YearMonth) => {
//   console.log('selectedFolderYearMonth', selectedFolderYearMonth);
//   const [photoItemList, setPhotoItemList] =
//     useState<
//       inferProcedureOutput<
//         AppRouter['getVRChatPhotoWithWorldIdAndDate']
//       >['data']
//     >();
//   const [photoItemFetchError, setPhotoItemFetchError] =
//     useState<
//       inferProcedureOutput<
//         AppRouter['getVRChatPhotoWithWorldIdAndDate']
//       >['error']
//     >(null);

//   const photoItemListQuery =
//     trpcReact.getVRChatPhotoWithWorldIdAndDate.useQuery(
//       selectedFolderYearMonth,
//       {
//         enabled: !!(
//           selectedFolderYearMonth.year && selectedFolderYearMonth.month
//         ),
//       },
//     );

//   const sortedPhotoItems = useMemo(() => {
//     if (!photoItemListQuery.data?.data) {
//       return [];
//     }

//     const list = photoItemListQuery.data.data;
//     return [...list].sort((a, b) => {
//       const datetimeA =
//         a.datetime.date.year +
//         a.datetime.date.month +
//         a.datetime.date.day +
//         a.datetime.time.hour +
//         a.datetime.time.minute +
//         a.datetime.time.second +
//         a.datetime.time.millisecond;
//       const datetimeB =
//         b.datetime.date.year +
//         b.datetime.date.month +
//         b.datetime.date.day +
//         b.datetime.time.hour +
//         b.datetime.time.minute +
//         b.datetime.time.second +
//         b.datetime.time.millisecond;
//       return datetimeB.localeCompare(datetimeA);
//     });
//   }, [photoItemListQuery.data?.data]);

//   useEffect(() => {
//     setPhotoItemList(sortedPhotoItems);
//     setPhotoItemFetchError(photoItemListQuery.data?.error ?? null);
//   }, [sortedPhotoItems, photoItemListQuery.data?.error]);

//   const refetchPhotoItemList = () => photoItemListQuery.refetch();

//   return {
//     photoItemList,
//     setPhotoItemList,
//     photoItemFetchError,
//     refetchPhotoItemList,
//   };
// };

// /**
//  * 通常の順番で表示すると、WorldInfo が写真の下に表示されてしまうため、
//  * WorldInfo が写真の上に表示されるように並び替える
//  */
// export const sortPhotoList = (
//   photoList: ReturnType<typeof usePhotoItems>['photoItemList'],
// ): undefined | ReturnType<typeof usePhotoItems>['photoItemList'] => {
//   if (!photoList) {
//     return;
//   }
//   const resultPhotoList = [...photoList];
//   // JOINが存在するインデックスを保存
//   const joinIndexes = resultPhotoList.reduce(
//     (indexes: number[], item, index) => {
//       if (item.type === 'JOIN') {
//         indexes.push(index);
//       }
//       return indexes;
//     },
//     [],
//   );

//   // JOIN要素を逆順で移動
//   for (let i = joinIndexes.length - 2; i >= 0; i -= 1) {
//     const currentIndex = joinIndexes[i];
//     const nextIndex = joinIndexes[i + 1];

//     // 現在のJOIN要素を取得し、配列から削除
//     const joinElement = resultPhotoList.splice(currentIndex, 1)[0];

//     // 次のJOINの位置の後ろに挿入
//     resultPhotoList.splice(nextIndex, 0, joinElement);

//     // 配列が変更されたので、インデックスを更新
//     for (let j = i; j >= 0; j -= 1) {
//       if (joinIndexes[j] < nextIndex) {
//         joinIndexes[j] += 1;
//       }
//     }
//   }

//   return resultPhotoList;
// };
