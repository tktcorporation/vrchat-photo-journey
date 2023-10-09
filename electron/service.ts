import fs from 'fs';
import path from 'path';

const formatLogEntry = (logEntry: string) => {
  // Regular expression to extract the relevant information from the log entry
  const regex = /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}) .* \[Behaviour\] Joining (wrld_[a-f0-9-]+):.*/;
  const matches = logEntry.match(regex);

  // Check if the regular expression matched the log entry
  if (matches && matches.length >= 4) {
    // Extracting the relevant parts of the log entry
    const date = matches[1];
    const time = matches[2];
    const worldId = matches[3];

    // Formatting the extracted information into the desired output format
    const formattedDate = date.replace(/\./g, '-');
    const formattedTime = time.replace(/:/g, '-');
    return `VRChat_${formattedDate}_${formattedTime}_${worldId}`;
  }
  // Return an error message if the log entry did not match the expected format
  throw new Error('Log entry did not match the expected format');
};

export const getJoinWorldLogLines = (logFilesDir: string): string[] => {
  const logFileNames = fs.readdirSync(logFilesDir);
  // output_log から始まるファイル名のみを取得
  const logFileNamesFiltered = logFileNames.filter((fileName) => fileName.startsWith('output_log'));
  // 'Joining wrld' という文字列が含まれる行のみを取得
  const logLines = logFileNamesFiltered.map((fileName) => {
    const filePath = path.join(logFilesDir, fileName);
    console.log(filePath);
    const content = fs.readFileSync(filePath);
    const lines = content.toString().split('\n');
    const linesFiltered = lines.filter((line) => line.includes('Joining wrld'));
    return linesFiltered;
  });
  const logLinesFlattened = logLines.flat();

  // input: 2023.10.08 00:03:00 Log        -  [Behaviour] Joining wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f:92664~region(jp)
  // output: VRChat_2023-10-08_00-03-00_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f
  const formattedLogLines = logLinesFlattened.map((line) => {
    const formatted = formatLogEntry(line);
    return formatted;
  });
  return formattedLogLines;
};
