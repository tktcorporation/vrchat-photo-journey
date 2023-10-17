import fs from 'fs';
import path from 'path';

import * as worldLogInfo from './service/worldLogInfo';
import * as settingStore from './settingStore';

const getStatusToUseVRChatLogFilesDir = (): 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' => {
  const vrchatLogFilesDir = settingStore.get('logFilesDir');
  if (typeof vrchatLogFilesDir !== 'string') {
    return 'logFilesDirNotSet';
  }
  const logFileNames = worldLogInfo.getVRChatLogFileNamesByDir(vrchatLogFilesDir);
  if (logFileNames.length === 0) {
    return 'logFilesNotFound';
  }
  return 'ready';
};

const createFiles = (vrchatPhotoDir: string, worldJoinLogInfoList: worldLogInfo.WorldJoinLogInfo[]) => {
  // ファイルを作成
  // vrchatPhotoDir/year-month/oneline.txt
  const filePaths = worldJoinLogInfoList.map((info) =>
    path.join(
      vrchatPhotoDir,
      `${info.year}-${info.month}`,
      `${worldLogInfo.convertWorldJoinLogInfoToOneLine(info)}.html`
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
  files.forEach((file) => {
    // q: 同名のファイルがある場合は上書きされますか？
    // a: 上書きされます
    fs.writeFileSync(file.filePath, file.content);
  });
};

const convertLogLinesToWorldJoinLogInfosByVRChatLogDir = (logDir: string): worldLogInfo.WorldJoinLogInfo[] => {
  const logLines = worldLogInfo.getLogLinesFromDir(logDir);
  return worldLogInfo.convertLogLinesToWorldJoinLogInfos(logLines);
};

export { createFiles, convertLogLinesToWorldJoinLogInfosByVRChatLogDir, getStatusToUseVRChatLogFilesDir };
