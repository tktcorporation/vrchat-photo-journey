type WorldId = `wrld_${string}`;
interface WorldJoinLogInfo {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  worldId: WorldId;
}

const validateWorldId = (value: string): value is WorldId => {
  const regex = /^wrld_[a-f0-9-]+$/;
  return regex.test(value);
};

const converLogEntryToWorldJoinLogInfo = (logEntry: string): WorldJoinLogInfo => {
  // input: 2023.10.08 00:03:00 Log        -  [Behaviour] Joining wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f:92664~region(jp)

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
    // return `VRChat_${formattedDate}_${formattedTime}_${worldId}`;
    const [year, month, day] = formattedDate.split('-');
    const [hour, minute, second] = formattedTime.split('-');
    if (!validateWorldId(worldId)) {
      throw new Error('WorldId did not match the expected format');
    }
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      worldId
    };
  }
  // Return an error message if the log entry did not match the expected format
  throw new Error('Log entry did not match the expected format');
};

// output: VRChat_2023-10-08_00-03-00_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f
const convertLogLinesToWorldJoinLogInfos = (logLines: string[]): WorldJoinLogInfo[] => {
  const linesFiltered = logLines.filter((line) => line.includes('Joining wrld'));
  const worldJoinLogInfos = linesFiltered.map((logLine) => converLogEntryToWorldJoinLogInfo(logLine));
  return worldJoinLogInfos;
};

type WorldJoinLogInfoOneLine = string;

const convertWorldJoinLogInfoToOneLine = (worldJoinLogInfo: WorldJoinLogInfo): WorldJoinLogInfoOneLine => {
  const { year, month, day, hour, minute, second, worldId } = worldJoinLogInfo;
  // output: VRChat_2023-10-08_00-03-00_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f
  return `VRChat_${year}-${month}-${day}_${hour}-${minute}-${second}_${worldId}`;
};

// 一括 export
export {
  validateWorldId,
  converLogEntryToWorldJoinLogInfo,
  convertLogLinesToWorldJoinLogInfos,
  convertWorldJoinLogInfoToOneLine
};
export type { WorldId, WorldJoinLogInfo, WorldJoinLogInfoOneLine };
