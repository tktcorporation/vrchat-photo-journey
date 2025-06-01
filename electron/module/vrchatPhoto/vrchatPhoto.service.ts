import * as fsPromises from 'node:fs/promises';
import * as dateFns from 'date-fns';
import { app } from 'electron';
import { glob } from 'glob';
import * as neverthrow from 'neverthrow';
import * as path from 'pathe';
import sharp from 'sharp';
import { P, match } from 'ts-pattern';
import { getSettingStore } from '../settingStore';
import * as logger from './../../lib/logger';
import * as fs from './../../lib/wrappedFs';
import * as model from './model/vrchatPhotoPath.model';
import {
  type VRChatPhotoDirPath,
  VRChatPhotoDirPathSchema,
} from './valueObjects';

/**
 * VRChat の写真が保存されている場所のデフォルト値を取得する
 */
const getDefaultVRChatPhotoDir = (): VRChatPhotoDirPath => {
  // /workspaces/vrchat-albums/debug/photos/VRChat
  // return path.join('/workspaces/vrchat-albums/debug/photos');
  const logFilesDir =
    process.platform === 'win32' && process.env.USERPROFILE
      ? path.join(app.getPath('pictures') || '', 'VRChat')
      : path.join(process.env.HOME || '', 'Pictures', 'VRChat');

  return VRChatPhotoDirPathSchema.parse(logFilesDir);
};

/**
 * VRChat の写真が保存されている場所を指定、保存する
 */
export const setVRChatPhotoDirPathToSettingStore = (
  photoDir: VRChatPhotoDirPath,
) => {
  const settingStore = getSettingStore();
  settingStore.setVRChatPhotoDir(photoDir.value);
};

/**
 * VRChat の写真が保存されている場所をクリアする
 */
export const clearVRChatPhotoDirPathInSettingStore = () => {
  const settingStore = getSettingStore();
  const result = settingStore.clearStoredSetting('vrchatPhotoDir');
  if (result.isErr()) {
    throw result.error;
  }
};

/**
 * VRChat の写真の保存場所を取得する
 * 指定された場所が保存されていない場合は、デフォルトの場所を返す
 */
export const getVRChatPhotoDirPath = (): VRChatPhotoDirPath => {
  // 写真の保存箇所を取得
  const photoDir = getDefaultVRChatPhotoDir();

  // 保存箇所が設定されている場合はそれを返す
  const settingStore = getSettingStore();
  const storedPhotoDir = settingStore.getVRChatPhotoDir();
  if (storedPhotoDir) {
    return VRChatPhotoDirPathSchema.parse(storedPhotoDir);
  }

  return photoDir;
};

interface VRChatPhotoInfo {
  photoPath: string;
  takenAt: Date;
  width: number;
  height: number;
}

export const getVRChatPhotoList = async (
  dirPath: VRChatPhotoDirPath,
  lastProcessedDate?: Date | null,
): Promise<VRChatPhotoInfo[]> => {
  const targetDir = dirPath.value;
  if (!targetDir) {
    return [];
  }
  const normalizedTargetDir = path
    .normalize(targetDir)
    .split(path.sep)
    .join('/');
  const allPhotoPathList = await glob(`${normalizedTargetDir}/**/VRChat_*.png`);

  let targetPhotoPathList: string[];
  if (lastProcessedDate) {
    // Promise.all で並列処理
    const statsPromises = allPhotoPathList.map(async (photoPath) => {
      try {
        const stats = await fsPromises.stat(photoPath);
        return { photoPath, stats };
      } catch (error) {
        logger.error({
          message: `Failed to get stats for ${photoPath}`,
          stack: error instanceof Error ? error : new Error(String(error)),
        });
        return null;
      }
    });

    // 並列処理の結果を待機
    const statsResults = (await Promise.all(statsPromises)).filter(
      (result): result is NonNullable<typeof result> => result !== null,
    );

    targetPhotoPathList = statsResults
      .filter((r) => r.stats.mtime > lastProcessedDate)
      .map((r) => r.photoPath);
  } else {
    targetPhotoPathList = allPhotoPathList;
  }

  // 差分ファイルリストからメタデータを並列取得
  const photoInfoPromises = targetPhotoPathList.map(async (photoPath) => {
    const matchResult = photoPath.match(
      /VRChat_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3})/,
    );
    if (!matchResult) {
      return null;
    }
    const takenAt = dateFns.parse(
      matchResult[1],
      'yyyy-MM-dd_HH-mm-ss.SSS',
      new Date(),
    );
    const metadata = await sharp(photoPath).metadata();
    const height = metadata.height ?? 720;
    const width = metadata.width ?? 1280;
    return {
      photoPath,
      takenAt,
      width,
      height,
    };
  });
  const photoList = (await Promise.all(photoInfoPromises)).filter(
    (info): info is VRChatPhotoInfo => info !== null,
  );
  return photoList;
};

export const createVRChatPhotoPathIndex = async (
  lastProcessedDate?: Date | null,
) => {
  const targetDir = getVRChatPhotoDirPath();
  // lastProcessedDate を getVRChatPhotoList に渡す
  const mainPhotoList = await getVRChatPhotoList(targetDir, lastProcessedDate);
  const settingStore = getSettingStore();
  const extraDirs = settingStore.getVRChatPhotoExtraDirList();

  // 追加ディレクトリからの写真リストを取得 (同様に lastProcessedDate を渡す)
  const extraPhotoLists = await Promise.all(
    extraDirs.map(async (dir: VRChatPhotoDirPath) => {
      return getVRChatPhotoList(dir, lastProcessedDate);
    }),
  );

  // メインディレクトリと追加ディレクトリの写真リストを結合
  const allPhotoList = [...mainPhotoList, ...extraPhotoLists.flat()];

  if (allPhotoList.length === 0) {
    logger.debug('No new photos found to index.');
    return; // 更新する写真がない場合はここで終了
  }

  // DBに保存
  return model.createOrUpdateListVRChatPhotoPath(
    allPhotoList.map((photo) => ({
      photoPath: photo.photoPath,
      photoTakenAt: photo.takenAt,
      width: photo.width,
      height: photo.height,
    })),
  );
};

export const getVRChatPhotoPathList = async (query?: {
  gtPhotoTakenAt?: Date;
  ltPhotoTakenAt?: Date;
  orderByPhotoTakenAt: 'asc' | 'desc';
}) => {
  return model.getVRChatPhotoPathList(query);
};

export const getCountByYearMonthList = async () => {
  return model.getCountByYearMonthList();
};

/**
 * VRChat の写真のパスが有効かどうかを検証する
 * 無効な場合は削除する
 */
export const validateVRChatPhotoPathModel = async ({
  fullpath,
}: { fullpath: string }): Promise<
  'MODEL_NOT_FOUND' | 'VALID' | 'FILE_NOT_FOUND_MODEL_DELETED'
> => {
  const pathModel = await model.getVRChatPhotoPathByPhotoPath(fullpath);
  if (!pathModel) {
    return 'MODEL_NOT_FOUND';
  }
  if (!fs.existsSyncSafe(pathModel.photoPath)) {
    await model.deleteVRChatPhotoPathModel(pathModel);
    return 'FILE_NOT_FOUND_MODEL_DELETED';
  }
  return 'VALID';
};

export const getVRChatPhotoItemData = async ({
  photoPath,
  width,
}: {
  photoPath: string;
  // 指定しない場合は元画像のサイズをそのまま返す
  width?: number;
}): Promise<neverthrow.Result<string, 'InputFileIsMissing'>> => {
  try {
    const photoBuf = await sharp(photoPath)
      .resize(width ?? undefined)
      .toBuffer();
    return neverthrow.ok(
      `data:image/${path
        .extname(photoPath)
        .replace('.', '')};base64,${photoBuf.toString('base64')}`,
    );
  } catch (error) {
    if (!(error instanceof Error)) {
      throw new Error(JSON.stringify(error));
    }
    return neverthrow.err(
      match(error.message)
        .with(
          P.string.includes('Input file is missing'),
          () => 'InputFileIsMissing' as const,
        )
        .with(P.string, () => {
          throw error;
        })
        .exhaustive(),
    );
  }
};

export const getLatestPhotoDate = async (): Promise<Date | null> => {
  const latestPhoto = await model.getLatestVRChatPhoto();
  return latestPhoto?.photoTakenAt ?? null;
};
