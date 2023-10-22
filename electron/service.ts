import path from 'path';
import * as neverthrow from 'neverthrow';
import * as fs from './lib/wrappedFs';

import * as vrchatLogService from './service/vrchatLog/vrchatLog';
import * as vrchatPhotoService from './service/vrchatPhoto/service';
import VRChatLogFileError from './service/vrchatLog/error';

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

const createFiles = (
  vrchatPhotoDir: string,
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[]
): neverthrow.Result<void, Error> => {
  // ファイルを作成
  // vrchatPhotoDir/year-month/oneline.txt
  const filePaths = worldJoinLogInfoList.map((info) =>
    path.join(
      vrchatPhotoDir,
      `${info.year}-${info.month}`,
      `${vrchatLogService.convertWorldJoinLogInfoToOneLine(info)}.html`
    )
  );
  // https://vrchat.com/home/world/wrld_4eeb98e0-2c89-4677-8b33-af1ec22e7a69
  // url にリダイレクトを行うhtmlファイルを作成
  const contents = worldJoinLogInfoList.map((info) => {
    return `<html>
  <head>
    <meta http-equiv="refresh" content="0;URL=https://vrchat.com/home/world/${info.worldId}" />
  </head>
  <body>
    <p>Redirecting to <a href="https://vrchat.com/home/world/${info.worldId}">${info.worldName}</a></p>
  </body>
</html>
`;
  });
  const files = filePaths.map((filePath, index) => {
    const content = contents[index];
    return { filePath, content };
  });

  // ファイルを作成
  for (const file of files) {
    const result = fs.writeFileSyncSafe(file.filePath, file.content);
    if (result.isErr()) {
      return neverthrow.err(result.error);
    }
  }

  return neverthrow.ok(undefined);
};

const convertLogLinesToWorldJoinLogInfosByVRChatLogDir = (
  logDir: string
): neverthrow.Result<vrchatLogService.WorldJoinLogInfo[], VRChatLogFileError> => {
  const result = vrchatLogService.getLogLinesFromDir(logDir);
  return result.map((logLines) => vrchatLogService.convertLogLinesToWorldJoinLogInfos(logLines));
};

export { createFiles, convertLogLinesToWorldJoinLogInfosByVRChatLogDir, getVRChatLogFilesDir, getVRChatPhotoDir };
