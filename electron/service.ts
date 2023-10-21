import fs from 'fs';
import path from 'path';

import * as worldLogInfo from './service/vrchatLog';
import * as settingStore from './settingStore';

const getVRChatLogFilesDir = (): {
  storedPath: string | null;
  error: null | 'logFilesNotFound';
} => {
  const storedPath = settingStore.getLogFilesDir();
  if (storedPath === null) {
    return { storedPath, error: null };
  }
  const logFileNames = worldLogInfo.getVRChatLogFileNamesByDir(storedPath);
  if (logFileNames.length === 0) {
    return { storedPath, error: 'logFilesNotFound' };
  }
  return { storedPath, error: null };
};

const getVRChatPhotoDir = (): {
  storedPath: string | null;
  error: null | 'photoYearMonthDirsNotFound';
} => {
  const storedPath = settingStore.getVRChatPhotoDir();
  if (storedPath === null) {
    return { storedPath, error: null };
  }
  // 指定されたdir になにがあるか調べる
  const dirNames = fs.readdirSync(storedPath);
  // 写真が保存されていれば作成されているはずの year-month ディレクトリを取得
  const yearMonthDirNames = dirNames.filter((dirName) => /^\d{4}-\d{2}$/.test(dirName));
  if (yearMonthDirNames.length === 0) {
    return { storedPath, error: 'photoYearMonthDirsNotFound' };
  }
  return { storedPath, error: null };
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

export { createFiles, convertLogLinesToWorldJoinLogInfosByVRChatLogDir, getVRChatLogFilesDir, getVRChatPhotoDir };
