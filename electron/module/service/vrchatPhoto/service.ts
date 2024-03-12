import path from 'node:path';
import { app } from 'electron';
import * as neverthrow from 'neverthrow';
import sharp from 'sharp';
import { match } from 'ts-pattern';
import * as fs from '../../lib/wrappedFs';
import { YearMonthPathNotFoundError } from '../error';
import * as t from '../type';

const getDefaultVRChatPhotoDir = (): string => {
  const logFilesDir =
    process.platform === 'win32' && process.env.USERPROFILE
      ? path.join(app.getPath('pictures') || '', 'VRChat')
      : path.join(process.env.HOME || '', 'Pictures', 'VRChat');

  return logFilesDir;
};

const validateError = [
  'photoYearMonthDirsNotFound',
  'photoDirReadError',
] as const;
const validateVRChatPhotoDir = (
  dir: string,
): neverthrow.Result<string, (typeof validateError)[number]> => {
  const dirNames = fs.readDirSyncSafe(dir);
  if (dirNames.isErr()) {
    return neverthrow.err('photoDirReadError');
  }
  const yearMonthDirNames = dirNames.value.filter((dirName) =>
    /^\d{4}-\d{2}$/.test(dirName),
  );
  if (yearMonthDirNames.length === 0) {
    return neverthrow.err('photoYearMonthDirsNotFound');
  }
  return neverthrow.ok(dir);
};

const getVRChatPhotoDir = (props: {
  storedPath: string | null;
}): {
  storedPath: string | null;
  path: string;
  error: null | (typeof validateError)[number];
} => {
  const defaultPath = getDefaultVRChatPhotoDir();

  const targetPath = props.storedPath ?? defaultPath;
  const validateResult = validateVRChatPhotoDir(targetPath);
  if (validateResult.isOk()) {
    return { storedPath: props.storedPath, path: targetPath, error: null };
  }
  return {
    storedPath: props.storedPath,
    path: targetPath,
    error: validateResult.error,
  };
};

const getVRChatPhotoFolderYearMonthList = (props: {
  storedPath: string | null;
}): neverthrow.Result<
  { year: string; month: string }[],
  'PHOTO_DIR_READ_ERROR' | 'PHOTO_YEAR_MONTH_DIRS_NOT_FOUND'
> => {
  const { path: photoDir, error } = getVRChatPhotoDir(props);
  if (error !== null) {
    return match(error)
      .with('photoDirReadError', () =>
        neverthrow.err('PHOTO_DIR_READ_ERROR' as const),
      )
      .with('photoYearMonthDirsNotFound', () =>
        neverthrow.err('PHOTO_YEAR_MONTH_DIRS_NOT_FOUND' as const),
      )
      .exhaustive();
  }
  const dirNames = fs.readDirSyncSafe(photoDir);
  if (dirNames.isErr()) {
    return match(dirNames.error)
      .with('ENOENT', () => neverthrow.err('PHOTO_DIR_READ_ERROR' as const))
      .exhaustive();
  }
  const yearMonthDirNames = dirNames.value.filter((dirName) =>
    /^\d{4}-\d{2}$/.test(dirName),
  );
  if (yearMonthDirNames.length === 0) {
    return neverthrow.err('PHOTO_YEAR_MONTH_DIRS_NOT_FOUND' as const);
  }
  const yearMonthList = yearMonthDirNames.map((yearMonthDirName) => {
    const [year, month] = yearMonthDirName.split('-');
    return { year, month };
  });
  return neverthrow.ok(yearMonthList);
};

/**
 * VRChatの写真もそれ以外も含む
 */
const getVRChatPhotoItemPathListByYearMonth = (props: {
  storedVRCPhotoDir: string | null;
  year: string;
  month: string;
}): neverthrow.Result<string[], Error | YearMonthPathNotFoundError> => {
  const { path: photoDir, error } = getVRChatPhotoDir({
    storedPath: props.storedVRCPhotoDir,
  });
  if (error !== null) {
    return match(error)
      .with('photoYearMonthDirsNotFound', () =>
        neverthrow.err(new Error(error)),
      )
      .with('photoDirReadError', () => neverthrow.err(new Error(error)))
      .exhaustive();
  }
  const yearMonthDir = path.join(
    photoDir,
    `${props.year}-${props.month.toString().padStart(2, '0')}`,
  );
  const photoItemNamesResult = fs.readDirSyncSafe(yearMonthDir);
  if (photoItemNamesResult.isErr()) {
    return match(photoItemNamesResult.error)
      .with('ENOENT', () =>
        neverthrow.err(new YearMonthPathNotFoundError(yearMonthDir)),
      )
      .exhaustive();
  }
  const photoItemPathList = photoItemNamesResult.value.map((photoItemName) =>
    path.join(yearMonthDir, photoItemName),
  );

  return neverthrow.ok(photoItemPathList);
};

/**
 * VRChatの写真pathのみを返す
 */
const getVRChatPhotoOnlyItemPathListByYearMonth = (props: {
  storedVRCPhotoDir: string | null;
  year: string;
  month: string;
}): neverthrow.Result<
  { path: string; info: t.ParsedPhotoFileName }[],
  YearMonthPathNotFoundError
> => {
  const itemListResult = getVRChatPhotoItemPathListByYearMonth(props);
  if (itemListResult.isErr()) {
    if (itemListResult.error instanceof YearMonthPathNotFoundError) {
      return neverthrow.err(itemListResult.error);
    }
    return neverthrow.err(
      new Error('itemListResultError', { cause: itemListResult.error }),
    );
  }
  const photoItemPathList = itemListResult.value.map((itemPath) => {
    const itemExt = path.extname(itemPath);
    const fileName = path.basename(itemPath, itemExt);
    const photoFileNameParseResult = t.parsePhotoFileName(fileName);
    if (photoFileNameParseResult.isErr()) {
      return null;
    }
    const { date, time, resolution, ext } = photoFileNameParseResult.value;
    return {
      path: itemPath,
      info: {
        date,
        time,
        resolution,
        ext,
      },
    };
  });
  const photoItemPathListExcludeNull = photoItemPathList.filter(
    (photoItemPath) => photoItemPath !== null,
  ) as Exclude<(typeof photoItemPathList)[number], null>[];
  return neverthrow.ok(photoItemPathListExcludeNull);
};

const getVRChatPhotoItemDataList = (
  pathList: string[],
): neverthrow.Result<{ path: string; data: Buffer }[], Error> => {
  const photoItemDataList = [];
  for (const photoItemPath of pathList) {
    const photoItemDataResult = fs.readFileSafe(photoItemPath);
    if (photoItemDataResult.isErr()) {
      return neverthrow.err(photoItemDataResult.error);
    }
    photoItemDataList.push({
      path: photoItemPath,
      data: photoItemDataResult.value,
    });
  }
  return neverthrow.ok(photoItemDataList);
};

const getVRChatPhotoItemData = async (
  photoPath: string,
): Promise<neverthrow.Result<Buffer, Error>> => {
  try {
    return neverthrow.ok(await sharp(photoPath).resize(256).toBuffer());
  } catch (e) {
    if (e instanceof Error) {
      return neverthrow.err(e);
    }
    throw e;
  }
};

export {
  getVRChatPhotoDir,
  getVRChatPhotoItemPathListByYearMonth,
  getVRChatPhotoOnlyItemPathListByYearMonth,
  getVRChatPhotoItemDataList,
  getVRChatPhotoFolderYearMonthList,
  getVRChatPhotoItemData,
};
