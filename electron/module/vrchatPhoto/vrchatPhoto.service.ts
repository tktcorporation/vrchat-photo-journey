import * as dateFns from 'date-fns';
import { app } from 'electron';
import { glob } from 'glob';
import * as neverthrow from 'neverthrow';
import * as path from 'pathe';
import sharp from 'sharp';
import { P, match } from 'ts-pattern';
import * as fs from '../../lib/wrappedFs';
import { getSettingStore } from '../settingStore';
import * as model from './model/vrchatPhotoPath.model';
import {
  type VRChatPhotoDirPath,
  VRChatPhotoDirPathSchema,
} from './valueObjects';

/**
 * VRChat の写真が保存されている場所のデフォルト値を取得する
 */
const getDefaultVRChatPhotoDir = (): VRChatPhotoDirPath => {
  // /workspaces/vrchat-photo-journey/debug/photos/VRChat
  // return path.join('/workspaces/vrchat-photo-journey/debug/photos');
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

const getVRChatPhotoList = async (): Promise<VRChatPhotoInfo[]> => {
  // 写真の保存箇所を取得
  const photoDir = getVRChatPhotoDirPath();

  // 保存箇所のpathから写真のpathを再帰的に取得
  const photoList: VRChatPhotoInfo[] = [];

  // {photoDir}/**/VRChat_2023-11-08_15-11-42.163_2560x1440.png のようなファイル名のリストを取得
  const photoPathList = await glob(`${photoDir.value}/**/VRChat_*.png`);

  // ファイル名から日時を取得
  for (const photoPath of photoPathList) {
    const matchResult = photoPath.match(
      /VRChat_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3})/,
    );
    if (!matchResult) {
      continue;
    }

    const takenAt =
      // ファイル名の日時はlocal time なので、そのままparseする
      dateFns.parse(matchResult[1], 'yyyy-MM-dd_HH-mm-ss.SSS', new Date());

    // 画像のメタデータを取得
    const metadata = await sharp(photoPath).metadata();
    const height = metadata.height ?? 720;
    const width = metadata.width ?? 1280;

    photoList.push({
      photoPath,
      takenAt,
      width,
      height,
    });
  }

  return photoList;
};

export const createVRChatPhotoPathIndex = async (
  lastProcessedDate?: string | null,
) => {
  const photoList = await getVRChatPhotoList();
  const filteredPhotoList = lastProcessedDate
    ? photoList.filter((photo) => photo.takenAt > new Date(lastProcessedDate))
    : photoList;

  // DBに保存
  return model.createOrUpdateListVRChatPhotoPath(
    filteredPhotoList.map((photo) => ({
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

export const getVRChatPhotoItemData = async (
  input: string,
): Promise<neverthrow.Result<string, 'InputFileIsMissing'>> => {
  try {
    const photoBuf = await sharp(input).resize(256).toBuffer();
    return neverthrow.ok(
      `data:image/${path
        .extname(input)
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

export const getLatestPhotoDate = async (): Promise<string | null> => {
  const latestPhoto = await model.getLatestVRChatPhoto();
  return latestPhoto?.photoTakenAt.toISOString() ?? null;
};
