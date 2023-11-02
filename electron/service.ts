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

const createFiles2 = (): neverthrow.Result<void, string> => {
  // get log lines
  const logFilesDir = getVRChatLogFilesDir();
  if (typeof logFilesDir.path !== 'string') {
    return neverthrow.err('Log file path is not set');
  }
  if (logFilesDir.error !== null) {
    switch (logFilesDir.error) {
      case 'logFilesNotFound':
        return neverthrow.err('Log files not found');
      default:
        break;
    }
    return neverthrow.err(`Unknown error: ${logFilesDir.error}`);
  }
  const convertWorldJoinLogInfoListResult = convertLogLinesToWorldJoinLogInfosByVRChatLogDir(logFilesDir.path);
  if (convertWorldJoinLogInfoListResult.isErr()) {
    switch (convertWorldJoinLogInfoListResult.error.code) {
      case 'LOG_FILE_NOT_FOUND':
        // event.sender.send('toast', `Log file not found`);
        return neverthrow.err('Log file not found');
      case 'LOG_FILE_DIR_NOT_FOUND':
        // event.sender.send('toast', `Log file dir not found`);
        return neverthrow.err('Log file dir not found');
      case 'LOG_FILES_NOT_FOUND':
        // event.sender.send('toast', `Log files not found`);
        return neverthrow.err('Log files not found');
      default:
        break;
    }
    return neverthrow.err(`Unknown error: ${convertWorldJoinLogInfoListResult.error.code}`);
  }
  const convertWorldJoinLogInfoList = convertWorldJoinLogInfoListResult.value;

  // create files
  const vrchatPhotoDir = getVRChatPhotoDir();
  if (typeof vrchatPhotoDir.storedPath !== 'string') {
    // event.sender.send('toast', `VRChat photo path is not set`);
    return neverthrow.err('VRChat photo path is not set');
  }
  if (vrchatPhotoDir.error !== null) {
    switch (vrchatPhotoDir.error) {
      case 'photoYearMonthDirsNotFound':
        // event.sender.send('toast', `Photo year-month dirs not found`);
        return neverthrow.err('Photo year-month dirs not found');
      default:
        break;
    }
    return neverthrow.err(`Unknown error: ${vrchatPhotoDir.error}`);
  }

  const result = createFiles(vrchatPhotoDir.storedPath, convertWorldJoinLogInfoList);
  return result
    .map(() => {
      return undefined;
    })
    .mapErr((error) => {
      return error.message;
    });
};

export {
  createFiles,
  createFiles2,
  convertLogLinesToWorldJoinLogInfosByVRChatLogDir,
  getVRChatLogFilesDir,
  getVRChatPhotoDir
};
