import * as neverthrow from 'neverthrow';

import path from 'path';
import * as datefns from 'date-fns';
import * as infoFileService from './service/infoFile/service';
import {
  JoinInfoFileNameSchema,
  PhotoFileNameSchema,
  parseJoinInfoFileName,
  parsePhotoFileName,
} from './service/type';
import * as utilsService from './service/utilsService';
import VRChatLogFileError from './service/vrchatLog/error';
import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import * as vrchatPhotoService from './service/vrchatPhoto/service';
import * as settingStore from './settingStore';

const getVRChatLogFilesDir = (): {
  storedPath: string | null;
  path: string;
  error: null | 'logFilesNotFound' | 'logFileDirNotFound';
} => {
  return vrchatLogService.getVRChatLogFileDir();
};

const getVRChatPhotoDir = () => {
  return vrchatPhotoService.getVRChatPhotoDir();
};

const convertLogLinesToWorldJoinLogInfosByVRChatLogDir = (
  logDir: string,
): neverthrow.Result<
  vrchatLogService.WorldJoinLogInfo[],
  VRChatLogFileError
> => {
  const result = vrchatLogService.getLogLinesFromDir(logDir);
  return result.map((logLines) =>
    vrchatLogService.convertLogLinesToWorldJoinLogInfos(logLines),
  );
};

const getConfigAndValidateAndGetToCreateInfoFileMap = async (): Promise<
  neverthrow.Result<
    {
      info: vrchatLogService.WorldJoinLogInfo;
      yearMonthPath: string;
      fileName: string;
      content: Buffer;
    }[],
    string
  >
> => {
  const logFilesDir = getVRChatLogFilesDir();
  if (logFilesDir.error !== null) {
    return neverthrow.err(`${logFilesDir.error}`);
  }
  const convertWorldJoinLogInfoListResult =
    convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    return neverthrow.err(`${convertWorldJoinLogInfoListResult.error.code}`);
  }
  const worldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = getVRChatPhotoDir();
  if (vrchatPhotoDir.error !== null) {
    return neverthrow.err(vrchatPhotoDir.error);
  }

  const result = await infoFileService.getToCreateMap(
    vrchatPhotoDir.path,
    worldJoinLogInfoList,
  );
  return result.mapErr((error) => {
    return `${error}`;
  });
};

const getConfigAndValidateAndCreateFiles = async (): Promise<
  neverthrow.Result<void, string>
> => {
  const logFilesDir = getVRChatLogFilesDir();
  if (logFilesDir.error !== null) {
    return neverthrow.err(`${logFilesDir.error}`);
  }
  const convertWorldJoinLogInfoListResult =
    convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    return neverthrow.err(`${convertWorldJoinLogInfoListResult.error.code}`);
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = getVRChatPhotoDir();
  if (vrchatPhotoDir.error !== null) {
    return neverthrow.err(vrchatPhotoDir.error);
  }

  const result = await infoFileService.createFiles(
    vrchatPhotoDir.path,
    convertWorldJoinLogInfoList,
  );
  return result
    .map(() => {
      return undefined;
    })
    .mapErr((error) => {
      return `${error.type}: ${error.error}`;
    });
};

/**
 * どの写真がどこで撮られたのかのデータを返す
 */
const getWorldJoinInfoWithPhotoPath = async (): Promise<
  neverthrow.Result<
    {
      world: {
        worldId: string;
        worldName: string;
        joinDatetime: Date;
      };
      tookPhotoList: {
        path: string;
        tookDatetime: Date;
      }[];
    }[],
    string
  >
> => {
  const err = (error: string) => {
    return neverthrow.err(`getWorldJoinInfoWithPhotoPath: ${error}`);
  };

  const logFilesDir = getVRChatLogFilesDir();
  if (logFilesDir.error !== null) {
    return err(`${logFilesDir.error}`);
  }
  const convertWorldJoinLogInfoListResult =
    convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    return err(`${convertWorldJoinLogInfoListResult.error.code}`);
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  const worldJoinInfoList = convertWorldJoinLogInfoList.map((info) => {
    return {
      worldId: info.worldId,
      worldName: info.worldName,
      joinDatetime: datefns.parse(
        `${info.year}-${info.month}-${info.day} ${info.hour}:${info.minute}:${info.second}`,
        'yyyy-MM-dd HH:mm:ss',
        new Date(),
      ),
    };
  });
  // sort by date asc
  const sortedWorldJoinInfoList = worldJoinInfoList.sort((a, b) => {
    return datefns.compareAsc(a.joinDatetime, b.joinDatetime);
  });

  // log上で一番最初のJoin日時を取得
  const firstJoinDate = sortedWorldJoinInfoList[0].joinDatetime;

  // 今月までのyear-monthディレクトリを取得
  // firstJoinDate が 2022-12 で 現在が 2023-03 だった場合、
  // 2022-12, 2023-01, 2023-02, 2023-03 のディレクトリを取得する
  const eachMonth = datefns.eachMonthOfInterval({
    start: firstJoinDate,
    end: new Date(),
  });

  // 一番最初のJoin日時以降の写真を取得
  const vrchatPhotoDir = getVRChatPhotoDir();
  if (vrchatPhotoDir.error !== null) {
    return err(vrchatPhotoDir.error);
  }

  // 月ごとに写真を取得
  let photoPathList: {
    path: string;
    tookDatetime: Date;
  }[] = [];
  for (const d of eachMonth) {
    const monthString = datefns.format(d, 'yyyy-MM');
    const photoPathListResult =
      vrchatPhotoService.getVRChatPhotoOnlyItemPathListByYearMonth(
        monthString.split('-')[0],
        monthString.split('-')[1],
      );
    if (photoPathListResult.isErr()) {
      return err(photoPathListResult.error);
    }
    photoPathList = photoPathListResult.value.map((photo) => {
      return {
        path: photo.path,
        tookDatetime: datefns.parse(
          `${photo.info.date.year}-${photo.info.date.month}-${photo.info.date.day} ${photo.info.time.hour}:${photo.info.time.minute}:${photo.info.time.second}`,
          'yyyy-MM-dd HH:mm:ss',
          new Date(),
        ),
      };
    });
  }

  // ワールドのJoin情報と写真の情報を結合
  const result = sortedWorldJoinInfoList.map((world, index) => {
    const nextWorldJoinDate =
      index < sortedWorldJoinInfoList.length - 1
        ? datefns.subSeconds(
            new Date(sortedWorldJoinInfoList[index + 1].joinDatetime),
            1,
          )
        : new Date();

    const tookPhotoList = photoPathList.filter(
      (photo) =>
        datefns.isAfter(photo.tookDatetime, world.joinDatetime) &&
        datefns.isBefore(photo.tookDatetime, nextWorldJoinDate),
    );

    return {
      world,
      tookPhotoList,
    };
  });

  return neverthrow.ok(result);
};

const clearAllStoredSettings = () => {
  settingStore.clearAllStoredSettings();
};
const clearStoredSetting = (
  key: Parameters<typeof settingStore.clearStoredSetting>[0],
) => {
  return settingStore.clearStoredSetting(key);
};

const openPathOnExplorer = (filePath: string) => {
  return utilsService.openPathInExplorer(filePath);
};

const openDirOnExplorer = (dirPath: string) => {
  const dir = path.dirname(dirPath);
  return utilsService.openPathInExplorer(dir);
};

const setVRChatPhotoDirByDialog = async (): Promise<
  neverthrow.Result<void, Error | 'canceled'>
> => {
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    settingStore.setVRChatPhotoDir(dirPath);
    return undefined;
  });
};

const setVRChatLogFilesDirByDialog = async (): Promise<
  neverthrow.Result<void, Error | 'canceled'>
> => {
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    settingStore.setLogFilesDir(dirPath);
    return undefined;
  });
};

type DateTime = {
  date: {
    year: string;
    month: string;
    day: string;
  };
  time: {
    hour: string;
    minute: string;
    second: string;
    millisecond: string;
  };
};
const getVRChatPhotoWithWorldIdAndDate = ({
  year,
  month,
}: {
  year: string;
  month: string;
}): neverthrow.Result<
  (
    | {
        type: 'PHOTO';
        datetime: DateTime;
        path: string;
        worldId: null;
      }
    | {
        type: 'JOIN';
        datetime: DateTime;
        path: string;
        worldId: string;
      }
  )[],
  'YEAR_MONTH_DIR_ENOENT' | 'PHOTO_DIR_READ_ERROR'
> => {
  const result = vrchatPhotoService.getVRChatPhotoItemPathListByYearMonth(
    year,
    month,
  );
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }
  const pathList = result.value;
  const objList = pathList.map((item) => {
    const ext = path.extname(item);
    const fileName = path.basename(item, ext);
    const photoFileNameParseResult = PhotoFileNameSchema.safeParse(fileName);
    const JoinInfoFileNameParseResult =
      JoinInfoFileNameSchema.safeParse(fileName);
    if (photoFileNameParseResult.success) {
      const photoFileName = photoFileNameParseResult.data;
      const parseResult = parsePhotoFileName(photoFileName);
      if (parseResult.isErr()) {
        return null;
      }
      const { date, time } = parseResult.value;
      return {
        type: 'PHOTO' as const,
        datetime: { date, time },
        path: item,
        worldId: null,
      };
    }
    if (JoinInfoFileNameParseResult.success) {
      const joinInfoFileName = JoinInfoFileNameParseResult.data;
      const parseResult = parseJoinInfoFileName(joinInfoFileName);
      if (parseResult.isErr()) {
        return null;
      }
      const { date, time, worldId } = parseResult.value;
      return {
        type: 'JOIN' as const,
        datetime: { date, time },
        path: item,
        worldId,
      };
    }
    return null;
  });
  const filteredObjList = objList.filter((obj) => obj !== null) as Exclude<
    typeof objList[number],
    null
  >[];
  return neverthrow.ok(filteredObjList);
};

const getVRChatPhotoItemDataListByYearMonth = (
  year: string,
  month: string,
): neverthrow.Result<
  { path: string; data: Buffer }[],
  Error | 'YEAR_MONTH_DIR_ENOENT' | 'PHOTO_DIR_READ_ERROR'
> => {
  const result = vrchatPhotoService.getVRChatPhotoItemPathListByYearMonth(
    year,
    month,
  );
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }
  const pathList = result.value;
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  const photoItemPathList = pathList.filter((p) => {
    const ext = path.extname(p);
    return imageExtensions.includes(ext);
  });
  return vrchatPhotoService.getVRChatPhotoItemDataList(photoItemPathList);
};

const { getVRChatPhotoFolderYearMonthList, getVRChatPhotoItemData } =
  vrchatPhotoService;

export {
  getVRChatPhotoFolderYearMonthList,
  setVRChatLogFilesDirByDialog,
  setVRChatPhotoDirByDialog,
  getConfigAndValidateAndCreateFiles,
  getConfigAndValidateAndGetToCreateInfoFileMap,
  getWorldJoinInfoWithPhotoPath,
  getVRChatLogFilesDir,
  getVRChatPhotoDir,
  clearAllStoredSettings,
  clearStoredSetting,
  openPathOnExplorer,
  openDirOnExplorer,
  getVRChatPhotoItemDataListByYearMonth,
  getVRChatPhotoWithWorldIdAndDate,
  getVRChatPhotoItemData,
};
