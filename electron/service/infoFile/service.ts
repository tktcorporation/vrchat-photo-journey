import path from "path";
// import nodeHtmlToImage from 'node-html-to-image';
import * as neverthrow from "neverthrow";
import * as fs from "../../lib/wrappedFs";

import * as vrchatLogService from "../vrchatLog/vrchatLog";
import { createOGPImage } from "./createWorldNameImage";

// const getHtmlContent = (info: vrchatLogService.WorldJoinLogInfo): string => {
//   return `<!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8">
//     <meta http-equiv="refresh" content="0;URL=https://vrchat.com/home/world/${info.worldId}" />
//     <title>Redirecting...</title>
//     <style>
//       body {
//         margin: 0;
//         padding: 0;
//         display: flex;
//         justify-content: center;
//         align-items: center;      background-color: #e0f7fa; /* Light blue background */
//         color: #37474f; /* Dark grey text */
//       }
//       a {
//         text-decoration: none;
//         color: #37474f; /* Dark grey text */
//         font-size: 48px; /* Larger text size */
//       }
//       p {
//         margin: 0;
//       }
//     </style>
//   </head>
//   <body>
//     <p><a href="https://vrchat.com/home/world/${info.worldId}">${info.worldName}</a></p>
//   </body>
//   </html>`;
// };

const CreateFilesError = [
	"FAILED_TO_CREATE_YEAR_MONTH_DIR",
	"FAILED_TO_CREATE_FILE",
	"FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS",
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
	const toCreateMap: {
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
			)}.png`;
			// const contentImage = await nodeHtmlToImage({ html: getHtmlContent(info) });
			const contentImage = await createOGPImage({
				worldName: info.worldName,
				date: {
					year: Number(info.year),
					month: Number(info.month),
					day: Number(info.day),
				},
				exif: {
					dateTimeOriginal: new Date(
						Number(info.year),
						Number(info.month) - 1,
						Number(info.day),
						Number(info.hour),
						Number(info.minute),
						Number(info.second),
					),
					description: info.worldId,
				},
			});
			return { yearMonthPath, fileName, content: contentImage };
		}),
	);

	// ディレクトリを作成(なければ)
	// yearMonthPath が重複している場合は一つにまとめる
	const yearMonthPathSet = new Set(toCreateMap.map((map) => map.yearMonthPath));
	for (const yearMonthPath of yearMonthPathSet) {
		const fileExistsResult = fs.existsSyncSafe(yearMonthPath);
		if (fileExistsResult.isErr()) {
			return neverthrow.err({
				error: fileExistsResult.error,
				type: "FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS",
			});
		}
		if (fileExistsResult.value !== true) {
			// ディレクトリが存在しない場合のみ作成を試みる
			const result = fs.mkdirSyncSafe(yearMonthPath); // recursiveオプションは不要
			if (result.isErr()) {
				return neverthrow.err({
					error: result.error,
					type: "FAILED_TO_CREATE_YEAR_MONTH_DIR",
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
				type: "FAILED_TO_CREATE_FILE",
			});
		}
	}

	return neverthrow.ok(undefined);
};

export { createFiles };
