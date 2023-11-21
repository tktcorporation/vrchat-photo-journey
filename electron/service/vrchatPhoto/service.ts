import path from "path";
import { app } from "electron";
import * as neverthrow from "neverthrow";
import sharp from "sharp";
import { match } from "ts-pattern";
import * as fs from "../../lib/wrappedFs";
import * as settingStore from "../../settingStore";

const getDefaultVRChatPhotoDir = (): string => {
	const logFilesDir =
		process.platform === "win32" && process.env.USERPROFILE
			? path.join(app.getPath("pictures") || "", "VRChat")
			: path.join(process.env.HOME || "", "Pictures", "VRChat");

	return logFilesDir;
};

const validateError = [
	"photoYearMonthDirsNotFound",
	"photoDirReadError",
] as const;
const validateVRChatPhotoDir = (
	dir: string,
): neverthrow.Result<string, typeof validateError[number]> => {
	const dirNames = fs.readDirSyncSafe(dir);
	if (dirNames.isErr()) {
		return neverthrow.err("photoDirReadError");
	}
	const yearMonthDirNames = dirNames.value.filter((dirName) =>
		/^\d{4}-\d{2}$/.test(dirName),
	);
	if (yearMonthDirNames.length === 0) {
		return neverthrow.err("photoYearMonthDirsNotFound");
	}
	return neverthrow.ok(dir);
};

const getVRChatPhotoDir = (): {
	storedPath: string | null;
	path: string;
	error: null | typeof validateError[number];
} => {
	const storedPath = settingStore.getVRChatPhotoDir();
	const defaultPath = getDefaultVRChatPhotoDir();

	const targetPath = storedPath ?? defaultPath;
	const validateResult = validateVRChatPhotoDir(targetPath);
	if (validateResult.isOk()) {
		return { storedPath, path: targetPath, error: null };
	}
	return { storedPath, path: targetPath, error: validateResult.error };
};

const getVRChatPhotoFolderYearMonthList = (): neverthrow.Result<
	{ year: string; month: string }[],
	"PHOTO_DIR_READ_ERROR" | "PHOTO_YEAR_MONTH_DIRS_NOT_FOUND"
> => {
	const { path: photoDir, error } = getVRChatPhotoDir();
	if (error !== null) {
		return match(error)
			.with("photoDirReadError", () =>
				neverthrow.err("PHOTO_DIR_READ_ERROR" as const),
			)
			.with("photoYearMonthDirsNotFound", () =>
				neverthrow.err("PHOTO_YEAR_MONTH_DIRS_NOT_FOUND" as const),
			)
			.exhaustive();
	}
	const dirNames = fs.readDirSyncSafe(photoDir);
	if (dirNames.isErr()) {
		return match(dirNames.error)
			.with("ENOENT", () => neverthrow.err("PHOTO_DIR_READ_ERROR" as const))
			.exhaustive();
	}
	const yearMonthDirNames = dirNames.value.filter((dirName) =>
		/^\d{4}-\d{2}$/.test(dirName),
	);
	if (yearMonthDirNames.length === 0) {
		return neverthrow.err("PHOTO_YEAR_MONTH_DIRS_NOT_FOUND" as const);
	}
	const yearMonthList = yearMonthDirNames.map((yearMonthDirName) => {
		const [year, month] = yearMonthDirName.split("-");
		return { year, month };
	});
	return neverthrow.ok(yearMonthList);
};

/**
 * 写真もそれ以外も含む
 */
const getVRChatPhotoItemPathList = (
	year: string,
	month: string,
): neverthrow.Result<
	string[],
	"YEAR_MONTH_DIR_ENOENT" | "PHOTO_DIR_READ_ERROR"
> => {
	const { path: photoDir, error } = getVRChatPhotoDir();
	if (error !== null) {
		return match(error)
			.with("photoYearMonthDirsNotFound", () =>
				neverthrow.err("YEAR_MONTH_DIR_ENOENT" as const),
			)
			.with("photoDirReadError", () =>
				neverthrow.err("PHOTO_DIR_READ_ERROR" as const),
			)
			.exhaustive();
	}
	const yearMonthDir = path.join(
		photoDir,
		`${year}-${month.toString().padStart(2, "0")}`,
	);
	const photoItemNamesResult = fs.readDirSyncSafe(yearMonthDir);
	if (photoItemNamesResult.isErr()) {
		return match(photoItemNamesResult.error)
			.with("ENOENT", () => neverthrow.err("YEAR_MONTH_DIR_ENOENT" as const))
			.exhaustive();
	}
	const photoItemPathList = photoItemNamesResult.value.map((photoItemName) =>
		path.join(yearMonthDir, photoItemName),
	);

	return neverthrow.ok(photoItemPathList);
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
		return neverthrow.ok(await sharp(photoPath).resize(512).toBuffer());
	} catch (e) {
		if (e instanceof Error) {
			return neverthrow.err(e);
		}
		throw e;
	}
};

export {
	getVRChatPhotoDir,
	getVRChatPhotoItemPathList,
	getVRChatPhotoItemDataList,
	getVRChatPhotoFolderYearMonthList,
	getVRChatPhotoItemData,
};
