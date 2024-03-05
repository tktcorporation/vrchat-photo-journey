import path from 'path';
import * as datefns from 'date-fns';
import * as neverthrow from 'neverthrow';
import * as fs from '../lib/wrappedFs';

import * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import { generateOGPImageBuffer } from './service/createWorldNameImage';

const removeAdjacentDuplicateWorldEntries = (
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[],
): vrchatLogService.WorldJoinLogInfo[] => {
  worldJoinLogInfoList.sort((a, b) => {
    return datefns.compareAsc(
      new Date(
        Number(a.year),
        Number(a.month) - 1,
        Number(a.day),
        Number(a.hour),
        Number(a.minute),
        Number(a.second),
      ),
      new Date(
        Number(b.year),
        Number(b.month) - 1,
        Number(b.day),
        Number(b.hour),
        Number(b.minute),
        Number(b.second),
      ),
    );
  });

  // 隣接する重複を削除
  let previousWorldId: string | null = null;
  return worldJoinLogInfoList.filter((info, index) => {
    if (index === 0 || info.worldId !== previousWorldId) {
      previousWorldId = info.worldId;
      return true;
    }
    return false;
  });
};

const getToCreateMap = async (props: {
  vrchatPhotoDir: string;
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[];
  imageWidth?: number;
  // 同じワールドに連続して複数回入った履歴を削除するかどうか
  removeAdjacentDuplicateWorldEntriesFlag: boolean;
}): Promise<
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
  // 前処理された worldJoinLogInfoList を作成
  let preprocessedWorldJoinLogInfoList = props.worldJoinLogInfoList;
  if (props.removeAdjacentDuplicateWorldEntriesFlag) {
    preprocessedWorldJoinLogInfoList = removeAdjacentDuplicateWorldEntries(
      preprocessedWorldJoinLogInfoList,
    );
  }

  // ファイルの作成
  const toCreateMap: {
    info: vrchatLogService.WorldJoinLogInfo;
    yearMonthPath: string;
    fileName: string;
    content: Buffer;
  }[] = await Promise.all(
    preprocessedWorldJoinLogInfoList.map(async (info) => {
      const yearMonthPath = path.join(
        props.vrchatPhotoDir,
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
      const diffMinsToUtc = date.getTimezoneOffset();
      const utcDate = datefns.addMinutes(date, diffMinsToUtc);

      const contentImage = await generateOGPImageBuffer({
        worldName: info.worldName,
        date: {
          year: Number(info.year),
          month: Number(info.month),
          day: Number(info.day),
        },
        exif: {
          dateTimeOriginal: utcDate,
        },
        imageWidth: props.imageWidth,
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
const createFiles = async (props: {
  vrchatPhotoDir: string;
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[];
  removeAdjacentDuplicateWorldEntriesFlag: boolean;
}): Promise<
  neverthrow.Result<
    void,
    { error: Error; type: (typeof CreateFilesError)[number] }
  >
> => {
  const toCreateMapResult = await getToCreateMap({
    vrchatPhotoDir: props.vrchatPhotoDir,
    worldJoinLogInfoList: props.worldJoinLogInfoList,
    removeAdjacentDuplicateWorldEntriesFlag:
      props.removeAdjacentDuplicateWorldEntriesFlag,
  });
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

export {
  createFiles,
  getToCreateMap,
  groupingPhotoListByWorldJoinInfo,
  removeAdjacentDuplicateWorldEntries,
};
