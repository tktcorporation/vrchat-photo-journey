import path from 'path';
import * as datefns from 'date-fns';
import * as datefnsTz from 'date-fns-tz';
import * as log from 'electron-log';
import * as neverthrow from 'neverthrow';
import * as fs from '../../lib/wrappedFs';

import * as vrchatLogService from '../vrchatLog/vrchatLog';
import { createOGPImage } from './createWorldNameImage';

const getToCreateMap = async (
  vrchatPhotoDir: string,
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[],
  imageWidth?: number,
): Promise<
  neverthrow.Result<
    {
      info: vrchatLogService.WorldJoinLogInfo;
      yearMonthPath: string;
      fileName: string;
      content: Buffer;
    }[],
    Error
  >
> => {
  const toCreateMap: {
    info: vrchatLogService.WorldJoinLogInfo;
    yearMonthPath: string;
    fileName: string;
    content: Buffer;
  }[] = await Promise.all(
    worldJoinLogInfoList.map(async (info) => {
      const yearMonthPath = path.join(
        vrchatPhotoDir,
        `${info.year}-${info.month}`,
      );
      const fileName = `${vrchatLogService.convertWorldJoinLogInfoToOneLine(
        info,
      )}.jpeg`;
      const date = new Date(
        Number(info.year),
        Number(info.month) - 1,
        Number(info.day),
        Number(info.hour),
        Number(info.minute),
        Number(info.second),
      );
      // date は local time なので utc に変換
      // timezone は実行環境から取得する
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      log.info(`timeZone: ${timeZone}`);
      const localDateString = datefns.format(date, 'yyyy-MM-dd HH:mm:ss');
      log.info(`localDateString: ${localDateString}`);
      const utcDate = datefnsTz.zonedTimeToUtc(localDateString, timeZone);
      log.info(`date: ${date} -> utcDate: ${utcDate}`);
      log.info(
        `date: ${datefns.format(
          date,
          'yyyy-MM-dd HH:mm:ss',
        )} -> utcDate: ${datefns.format(utcDate, 'yyyy-MM-dd HH:mm:ss')}`,
      );

      const contentImage = await createOGPImage({
        worldName: info.worldName,
        date: {
          year: Number(info.year),
          month: Number(info.month),
          day: Number(info.day),
        },
        exif: {
          dateTimeOriginal: utcDate,
          description: info.worldId,
        },
        imageWidth,
      });
      return { info, yearMonthPath, fileName, content: contentImage };
    }),
  );
  return neverthrow.ok(toCreateMap);
};

const CreateFilesError = [
  'FAILED_TO_CREATE_YEAR_MONTH_DIR',
  'FAILED_TO_CREATE_FILE',
  'FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS',
  'FAILED_TO_GET_TO_CREATE_MAP',
] as const;
const createFiles = async (
  vrchatPhotoDir: string,
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[],
): Promise<
  neverthrow.Result<
    void,
    { error: Error; type: typeof CreateFilesError[number] }
  >
> => {
  const toCreateMapResult = await getToCreateMap(
    vrchatPhotoDir,
    worldJoinLogInfoList,
  );
  if (toCreateMapResult.isErr()) {
    return neverthrow.err({
      error: toCreateMapResult.error,
      type: 'FAILED_TO_GET_TO_CREATE_MAP',
    });
  }
  const toCreateMap = toCreateMapResult.value;

  // ディレクトリを作成(なければ)
  // yearMonthPath が重複している場合は一つにまとめる
  const yearMonthPathSet = new Set(toCreateMap.map((map) => map.yearMonthPath));
  for (const yearMonthPath of yearMonthPathSet) {
    const fileExistsResult = fs.existsSyncSafe(yearMonthPath);
    if (fileExistsResult.isErr()) {
      return neverthrow.err({
        error: fileExistsResult.error,
        type: 'FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS',
      });
    }
    if (fileExistsResult.value !== true) {
      // ディレクトリが存在しない場合のみ作成を試みる
      const result = fs.mkdirSyncSafe(yearMonthPath); // recursiveオプションは不要
      if (result.isErr()) {
        return neverthrow.err({
          error: result.error,
          type: 'FAILED_TO_CREATE_YEAR_MONTH_DIR',
        });
      }
    }
  }

  // ファイルを作成
  for (const map of toCreateMap) {
    const result = fs.writeFileSyncSafe(
      path.join(map.yearMonthPath, map.fileName),
      map.content,
    );
    if (result.isErr()) {
      return neverthrow.err({
        error: result.error,
        type: 'FAILED_TO_CREATE_FILE',
      });
    }
  }

  return neverthrow.ok(undefined);
};

const groupingPhotoListByWorldJoinInfo = (
  worldJoinInfoList: {
    worldId: `wrld_${string}`;
    worldName: string;
    joinDatetime: Date;
  }[],
  vrcPhotoList: {
    photoPath: string;
    tookDatetime: Date;
  }[],
): {
  world: {
    worldId: `wrld_${string}`;
    worldName: string;
    joinDatetime: Date;
  };
  tookPhotoList: {
    photoPath: string;
    tookDatetime: Date;
  }[];
}[] => {
  const sortedWorldJoinInfoList = [...worldJoinInfoList].sort((a, b) => {
    return datefns.compareAsc(a.joinDatetime, b.joinDatetime);
  });
  return sortedWorldJoinInfoList.map((world, index) => {
    const nextWorldJoinDate =
      index < sortedWorldJoinInfoList.length - 1
        ? datefns.subSeconds(
            new Date(sortedWorldJoinInfoList[index + 1].joinDatetime),
            1,
          )
        : new Date();

    const tookPhotoList = vrcPhotoList.filter(
      (photo) =>
        datefns.isAfter(photo.tookDatetime, world.joinDatetime) &&
        datefns.isBefore(photo.tookDatetime, nextWorldJoinDate),
    );

    return {
      world,
      tookPhotoList,
    };
  });
};

export { createFiles, getToCreateMap, groupingPhotoListByWorldJoinInfo };
