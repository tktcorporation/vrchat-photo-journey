import * as neverthrow from "neverthrow";

import path from "path";
import * as infoFileService from "./service/infoFile/service";
import {
    JoinInfoFileNameSchema,
    PhotoFileNameSchema,
    parseJoinInfoFileName,
    parsePhotoFileName,
} from "./service/type";
import * as utilsService from "./service/utilsService";
import VRChatLogFileError from "./service/vrchatLog/error";
import * as vrchatLogService from "./service/vrchatLog/vrchatLog";
import * as vrchatPhotoService from "./service/vrchatPhoto/service";
import * as settingStore from "./settingStore";

const getVRChatLogFilesDir = (): {
    storedPath: string | null;
    path: string;
    error: null | "logFilesNotFound" | "logFileDirNotFound";
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

const createFiles = (
    vrchatPhotoDir: string,
    worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[],
) => {
    return infoFileService.createFiles(vrchatPhotoDir, worldJoinLogInfoList);
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
        return neverthrow.err(
            `${convertWorldJoinLogInfoListResult.error.code}`,
        );
    }
    const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

    // create files
    const vrchatPhotoDir = getVRChatPhotoDir();
    if (vrchatPhotoDir.error !== null) {
        return neverthrow.err(vrchatPhotoDir.error);
    }

    const result = await createFiles(
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
    neverthrow.Result<void, Error | "canceled">
> => {
    return (await utilsService.openGetDirDialog()).map((dirPath) => {
        settingStore.setVRChatPhotoDir(dirPath);
        return undefined;
    });
};

const setVRChatLogFilesDirByDialog = async (): Promise<
    neverthrow.Result<void, Error | "canceled">
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
              type: "PHOTO";
              datetime: DateTime;
              path: string;
              worldId: null;
          }
        | {
              type: "JOIN";
              datetime: DateTime;
              path: string;
              worldId: string;
          }
    )[],
    "YEAR_MONTH_DIR_ENOENT" | "PHOTO_DIR_READ_ERROR"
> => {
    const result = vrchatPhotoService.getVRChatPhotoItemPathList(year, month);
    if (result.isErr()) {
        return neverthrow.err(result.error);
    }
    const pathList = result.value;
    const objList = pathList.map((item) => {
        const ext = path.extname(item);
        const fileName = path.basename(item, ext);
        const photoFileNameParseResult =
            PhotoFileNameSchema.safeParse(fileName);
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
                type: "PHOTO" as const,
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
                type: "JOIN" as const,
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
    Error | "YEAR_MONTH_DIR_ENOENT" | "PHOTO_DIR_READ_ERROR"
> => {
    const result = vrchatPhotoService.getVRChatPhotoItemPathList(year, month);
    if (result.isErr()) {
        return neverthrow.err(result.error);
    }
    const pathList = result.value;
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp"];
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
