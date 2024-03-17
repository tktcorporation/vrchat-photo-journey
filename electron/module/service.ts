import * as neverthrow from 'neverthrow';

import path from 'node:path';
import * as datefns from 'date-fns';
import * as log from 'electron-log';
import * as infoFileService from './joinLogInfoFile/service';
import { getToCreateWorldJoinLogInfos } from './joinLogInfoFile/service';
import { YearMonthPathNotFoundError } from './service/error';
import { PhotoFileNameSchema, parsePhotoFileName } from './service/type';
import * as utilsService from './service/utilsService';
import type VRChatLogFileError from './service/vrchatLog/error';
import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import type VRChatPhotoFileError from './service/vrchatPhoto/error';
import * as vrchatPhotoService from './service/vrchatPhoto/service';
import type { getSettingStore } from './settingStore';
import {
  JoinInfoFileNameSchema,
  parseJoinInfoFileName,
} from './vrchatLog/type';

const getVRChatLogFilesDir =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  (): {
    storedPath: string | null;
    path: string;
    error: null | 'logFilesNotFound' | 'logFileDirNotFound';
  } => {
    return vrchatLogService.getVRChatLogFileDir({
      storedLogFilesDirPath: settingStore.getLogFilesDir(),
    });
  };

const getVRChatPhotoDir =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    return vrchatPhotoService.getVRChatPhotoDir({
      storedPath: settingStore.getVRChatPhotoDir(),
    });
  };

/**
 * どの写真がどこで撮られたのかのデータを返す
 */
const getWorldJoinInfoWithPhotoPath =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<
    neverthrow.Result<
      {
        world: null | {
          worldId: `wrld_${string}`;
          worldName: string;
          joinDatetime: Date;
        };
        tookPhotoList: {
          photoPath: string;
          tookDatetime: Date;
        }[];
      }[],
      YearMonthPathNotFoundError | VRChatLogFileError | VRChatPhotoFileError
    >
  > => {
    const convertWorldJoinLogInfoListResult =
      await getToCreateWorldJoinLogInfos(settingStore)();
    if (convertWorldJoinLogInfoListResult.isErr()) {
      return neverthrow.err(convertWorldJoinLogInfoListResult.error);
    }
    const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;
    log.debug(
      `convertWorldJoinLogInfoList len ${convertWorldJoinLogInfoList.length}`,
    );

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
    log.debug(`worldJoinInfoList len ${worldJoinInfoList.length}`);
    if (worldJoinInfoList.length === 0) {
      return neverthrow.ok([]);
    }
    // sort by date asc
    const sortedWorldJoinInfoList = worldJoinInfoList.sort((a, b) => {
      return datefns.compareAsc(a.joinDatetime, b.joinDatetime);
    });

    log.debug(`sortedWorldJoinInfoList len ${sortedWorldJoinInfoList.length}`);

    // log上で一番最初のJoin日時を取得
    const firstJoinDate = sortedWorldJoinInfoList[0].joinDatetime;

    // 今月までのyear-monthディレクトリを取得
    // firstJoinDate が 2022-12 で 現在が 2023-03 だった場合、
    // 2022-12, 2023-01, 2023-02, 2023-03 のディレクトリを取得する
    log.debug(`firstJoinDate ${firstJoinDate}`);
    const eachMonth = datefns.eachMonthOfInterval({
      start: firstJoinDate,
      end: new Date(),
    });

    // 月ごとに写真を取得
    const photoPathList: {
      path: string;
      tookDatetime: Date;
    }[] = [];
    for (const d of eachMonth) {
      const monthString = datefns.format(d, 'yyyy-MM');
      // path が存在しているか先に確認
      const photoPathListResult =
        vrchatPhotoService.getVRChatPhotoOnlyItemPathListByYearMonth({
          year: monthString.split('-')[0],
          month: monthString.split('-')[1],
          storedVRCPhotoDir: settingStore.getVRChatPhotoDir(),
        });
      if (photoPathListResult.isErr()) {
        if (photoPathListResult.error instanceof YearMonthPathNotFoundError) {
          // その月のディレクトリが存在しない場合はスキップ
          // 撮影していない月であれば存在しない
          log.warn(`yearMonth dir is not found ${photoPathListResult.error}`);
          continue;
        }
        return neverthrow.err(photoPathListResult.error);
      }
      photoPathList.push(
        ...photoPathListResult.value.map((photo) => {
          return {
            path: photo.path,
            tookDatetime: datefns.parse(
              `${photo.info.date.year}-${photo.info.date.month}-${photo.info.date.day} ${photo.info.time.hour}:${photo.info.time.minute}:${photo.info.time.second}`,
              'yyyy-MM-dd HH:mm:ss',
              new Date(),
            ),
          };
        }),
      );
    }
    log.debug(`photoPathList len ${photoPathList.length}`);

    // ワールドのJoin情報と写真の情報を結合
    const result = infoFileService.groupingPhotoListByWorldJoinInfo(
      sortedWorldJoinInfoList,
      photoPathList.map((photo) => {
        return {
          photoPath: photo.path,
          tookDatetime: photo.tookDatetime,
        };
      }),
    );
    log.debug('groupingPhotoListByWorldJoinInfo result len', result.length);

    return neverthrow.ok(result);
  };

const clearAllStoredSettings =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    settingStore.clearAllStoredSettings();
  };
const clearStoredSetting =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  (
    key: Parameters<
      ReturnType<typeof getSettingStore>['clearStoredSetting']
    >[0],
  ) => {
    return settingStore.clearStoredSetting(key);
  };

const openPathOnExplorer = (filePath: string) => {
  log.debug(`openPathOnExplorer ${filePath}`);
  return utilsService.openPathInExplorer(filePath);
};

const openElectronLogOnExplorer = async () => {
  const electronLogPath = log.transports.file.getFile().path;
  log.debug(`electronLogPath ${electronLogPath}`);
  return utilsService.openPathInExplorer(electronLogPath);
};

const openDirOnExplorer = (dirPath: string) => {
  const dir = path.dirname(dirPath);
  return utilsService.openPathInExplorer(dir);
};

const setVRChatPhotoDirByDialog =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<neverthrow.Result<void, Error | 'canceled'>> => {
    return (await utilsService.openGetDirDialog()).map((dirPath) => {
      settingStore.setVRChatPhotoDir(dirPath);
      return undefined;
    });
  };

const setVRChatLogFilesDirByDialog =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<neverthrow.Result<void, Error | 'canceled'>> => {
    return (await utilsService.openGetDirDialog()).map((dirPath) => {
      settingStore.setLogFilesDir(dirPath);
      return undefined;
    });
  };

const getRemoveAdjacentDuplicateWorldEntriesFlag =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<neverthrow.Result<boolean, Error>> => {
    return neverthrow.ok(
      settingStore.getRemoveAdjacentDuplicateWorldEntriesFlag() ?? false,
    );
  };

const setRemoveAdjacentDuplicateWorldEntriesFlag =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (flag: boolean): Promise<neverthrow.Result<void, Error>> => {
    return neverthrow.ok(
      settingStore.setRemoveAdjacentDuplicateWorldEntriesFlag(flag),
    );
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
const parseDateTime = (datetime: DateTime): Date => {
  return datefns.parseISO(
    `${datetime.date.year}-${datetime.date.month.padStart(
      2,
      '0',
    )}-${datetime.date.day.padStart(2, '0')}T${datetime.time.hour.padStart(
      2,
      '0',
    )}:${datetime.time.minute.padStart(2, '0')}:${datetime.time.second.padStart(
      2,
      '0',
    )}.${datetime.time.millisecond}Z`,
  );
};
type PhotoOrJoinImgInfo =
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
    };
const getVRChatPhotoWithWorldIdAndDate =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  ({
    year,
    month,
  }: {
    year: string;
    month: string;
  }): neverthrow.Result<PhotoOrJoinImgInfo[], Error> => {
    const result = vrchatPhotoService.getVRChatPhotoItemPathListByYearMonth({
      year,
      month,
      storedVRCPhotoDir: settingStore.getVRChatPhotoDir(),
    });
    if (result.isErr()) {
      return neverthrow.err(
        new Error(`${result.error}`, { cause: result.error }),
      );
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
      (typeof objList)[number],
      null
    >[];
    return neverthrow.ok(filteredObjList);
  };

interface JoinInfo {
  join: null | {
    joinDatetime: Date;
    worldId: string;
    imgPath: string;
  };
  photoList: {
    datetime: Date;
    path: string;
  }[];
}
type GetVRChatJoinInfoWithVRChatPhotoListResult = JoinInfo[];
const getVRChatJoinInfoWithVRChatPhotoList =
  (props: {
    getVRChatPhotoWithWorldIdAndDate: ReturnType<
      typeof getVRChatPhotoWithWorldIdAndDate
    >;
  }) =>
  ({
    year,
    month,
  }: { year: string; month: string }): neverthrow.Result<
    GetVRChatJoinInfoWithVRChatPhotoListResult,
    Error
  > => {
    const result = props.getVRChatPhotoWithWorldIdAndDate({ year, month });

    if (result.isErr()) {
      return neverthrow.err(result.error);
    }

    const data = result.value;

    // datetimeに基づいて時系列順にソート
    data.sort((a, b) => {
      const aDatetime = parseDateTime(a.datetime);
      const bDatetime = parseDateTime(b.datetime);
      return datefns.compareAsc(aDatetime, bDatetime);
    });

    const joinData: JoinInfo[] = [];

    for (let i = 0; i < data.length; i += 1) {
      if (data[i].type === 'JOIN') {
        const joinDatetime = parseDateTime(data[i].datetime);
        const nextJoinIndex = data.findIndex(
          (item, index) => index > i && item.type === 'JOIN',
        );

        const photoList = data
          .slice(i + 1, nextJoinIndex !== -1 ? nextJoinIndex : undefined)
          .filter((item) => item.type === 'PHOTO')
          .map((photo) => ({
            datetime: parseDateTime(photo.datetime),
            path: photo.path,
          }));

        const { worldId } = data[i];
        if (worldId === null) {
          throw new Error('要ロジック修正 data[i].worldId === null');
        }
        joinData.push({
          join: {
            joinDatetime,
            worldId,
            imgPath: data[i].path,
          },
          photoList,
        });
      }
    }

    // グルーピングから外れたphotoを別でまとめる
    const allPhoto = data
      .filter((item) => item.type === 'PHOTO')
      .map((photo) => ({
        datetime: parseDateTime(photo.datetime),
        path: photo.path,
      }));
    const alreadyJoinedPhoto = joinData.flatMap((item) => item.photoList);
    const notJoinedPhoto = allPhoto.filter(
      (photo) => !alreadyJoinedPhoto.some((item) => item.path === photo.path),
    );
    if (notJoinedPhoto.length > 0) {
      joinData.push({
        join: null,
        photoList: notJoinedPhoto,
      });
    }

    // joinDataの順番を逆にする
    joinData.reverse();

    return neverthrow.ok(joinData);
  };

const getVRChatPhotoItemDataListByYearMonth =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  (
    year: string,
    month: string,
  ): neverthrow.Result<
    { path: string; data: Buffer }[],
    Error | 'YEAR_MONTH_DIR_ENOENT' | 'PHOTO_DIR_READ_ERROR'
  > => {
    const result = vrchatPhotoService.getVRChatPhotoItemPathListByYearMonth({
      year,
      month,
      storedVRCPhotoDir: settingStore.getVRChatPhotoDir(),
    });
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

const getVRChatPhotoFolderYearMonthList =
  (settingStore: ReturnType<typeof getSettingStore>) => () => {
    return vrchatPhotoService.getVRChatPhotoFolderYearMonthList({
      storedPath: settingStore.getVRChatPhotoDir(),
    });
  };
const getVRChatPhotoItemData = (photoPath: string) => {
  return vrchatPhotoService.getVRChatPhotoItemData(photoPath);
};
const getVrcWorldInfoByWorldId = async (
  worldId: string,
): Promise<neverthrow.Result<{ name: string }, Error>> => {
  const reqUrl = `https://api.vrchat.cloud/api/1/worlds/${worldId}`;
  const response = await fetch(reqUrl);
  if (!response.ok) {
    return neverthrow.err(
      new Error(`getVrcWorldInfoByWorldId: ${response.statusText}`),
    );
  }
  const json = await response.json();
  return neverthrow.ok({ name: json.name });
};

// FIXME: 肥大化してきたので controller に分けて書いていくようにする
const getService = (settingStore: ReturnType<typeof getSettingStore>) => {
  return {
    getVRChatLogFilesDir: getVRChatLogFilesDir(settingStore),
    getVRChatPhotoDir: getVRChatPhotoDir(settingStore),
    getRemoveAdjacentDuplicateWorldEntriesFlag:
      getRemoveAdjacentDuplicateWorldEntriesFlag(settingStore),
    setRemoveAdjacentDuplicateWorldEntriesFlag:
      setRemoveAdjacentDuplicateWorldEntriesFlag(settingStore),
    getWorldJoinInfoWithPhotoPath: getWorldJoinInfoWithPhotoPath(settingStore),
    clearAllStoredSettings: clearAllStoredSettings(settingStore),
    clearStoredSetting: clearStoredSetting(settingStore),
    openPathOnExplorer,
    openElectronLogOnExplorer,
    openDirOnExplorer,
    setVRChatPhotoDirByDialog: setVRChatPhotoDirByDialog(settingStore),
    setVRChatLogFilesDirByDialog: setVRChatLogFilesDirByDialog(settingStore),
    getVRChatPhotoFolderYearMonthList:
      getVRChatPhotoFolderYearMonthList(settingStore),
    getVRChatPhotoItemDataListByYearMonth:
      getVRChatPhotoItemDataListByYearMonth(settingStore),
    getVRChatPhotoWithWorldIdAndDate:
      getVRChatPhotoWithWorldIdAndDate(settingStore),
    getVRChatPhotoItemData,
    getVrcWorldInfoByWorldId,
    getVRChatJoinInfoWithVRChatPhotoList,
  };
};

export { getService };
