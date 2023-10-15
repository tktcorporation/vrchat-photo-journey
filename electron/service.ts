import fs from 'fs';
import path from 'path';

import * as worldLogInfo from './service/worldLogInfo';

const getLogLinesFromDir = (logFilesDir: string): string[] => {
  const logFileNames = fs.readdirSync(logFilesDir);
  // output_log から始まるファイル名のみを取得
  const logFileNamesFiltered = logFileNames.filter((fileName) => fileName.startsWith('output_log'));
  // 'Joining wrld' という文字列が含まれる行のみを取得
  const logLines = logFileNamesFiltered.map((fileName) => {
    const filePath = path.join(logFilesDir, fileName);
    console.log(filePath);
    const content = fs.readFileSync(filePath);
    return content.toString().split('\n');
  });
  return logLines.flat();
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
  const contents = worldJoinLogInfoList
    .map((info) => info.worldId)
    .map((worldId) => {
      return `
      <html>
        <head>
          <meta http-equiv="refresh" content="0;URL=https://vrchat.com/home/world/${worldId}" />
        </head>
        <body>
          <p>Redirecting to <a href="https://vrchat.com/home/world/${worldId}">https://vrchat.com/home/world/${worldId}</a></p>
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

const convertLogLinesToWorldJoinLogInfos = (logLines: string[]): worldLogInfo.WorldJoinLogInfo[] => {
  return worldLogInfo.convertLogLinesToWorldJoinLogInfos(logLines);
};

export { getLogLinesFromDir, createFiles, convertLogLinesToWorldJoinLogInfos };
