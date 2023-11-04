import path from 'path';
import * as neverthrow from 'neverthrow';
import * as fs from '../../lib/wrappedFs';

import * as vrchatLogService from '../vrchatLog/vrchatLog';

const getHtmlContent = (info: vrchatLogService.WorldJoinLogInfo): string => {
  return `<html>
    <head>
      <meta http-equiv="refresh" content="0;URL=https://vrchat.com/home/world/${info.worldId}" />
    </head>
    <body>
      <p>Redirecting to <a href="https://vrchat.com/home/world/${info.worldId}">${info.worldName}</a></p>
    </body>
  </html>`;
};

const CreateFilesError = [
  'FAILED_TO_CREATE_YEAR_MONTH_DIR',
  'FAILED_TO_CREATE_FILE',
  'FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS'
] as const;
const createFiles = (
  vrchatPhotoDir: string,
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[]
): neverthrow.Result<void, { error: Error; type: (typeof CreateFilesError)[number] }> => {
  const toCreateMap: {
    yearMonthPath: string;
    fileName: string;
    content: string;
  }[] = worldJoinLogInfoList.map((info) => {
    const yearMonthPath = path.join(vrchatPhotoDir, `${info.year}-${info.month}`);
    const fileName = `${vrchatLogService.convertWorldJoinLogInfoToOneLine(info)}.html`;
    const content = getHtmlContent(info);
    return { yearMonthPath, fileName, content };
  });

  // ディレクトリを作成(なければ)
  // yearMonthPath が重複している場合は一つにまとめる
  const yearMonthPathSet = new Set(toCreateMap.map((map) => map.yearMonthPath));
  for (const yearMonthPath of yearMonthPathSet) {
    const fileExistsResult = fs.existsSyncSafe(yearMonthPath);
    if (fileExistsResult.isErr()) {
      return neverthrow.err({ error: fileExistsResult.error, type: 'FAILED_TO_CHECK_YEAR_MONTH_DIR_EXISTS' });
    }
    if (fileExistsResult.value !== true) {
      // ディレクトリが存在しない場合のみ作成を試みる
      const result = fs.mkdirSyncSafe(yearMonthPath); // recursiveオプションは不要
      if (result.isErr()) {
        return neverthrow.err({ error: result.error, type: 'FAILED_TO_CREATE_YEAR_MONTH_DIR' });
      }
    }
  }

  // ファイルを作成
  for (const map of toCreateMap) {
    const result = fs.writeFileSyncSafe(path.join(map.yearMonthPath, map.fileName), map.content);
    if (result.isErr()) {
      return neverthrow.err({ error: result.error, type: 'FAILED_TO_CREATE_FILE' });
    }
  }

  return neverthrow.ok(undefined);
};

export { createFiles };
