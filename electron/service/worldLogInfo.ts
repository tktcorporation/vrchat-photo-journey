type WorldId = `wrld_${string}`;
interface WorldJoinLogInfo {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  worldId: WorldId;
  worldName: string;
}

const validateWorldId = (value: string): value is WorldId => {
  const regex = /^wrld_[a-f0-9-]+$/;
  return regex.test(value);
};

const extractWorldJoinInfoFromLogs = (logLines: string[], index: number): WorldJoinLogInfo | null => {
  const logEntry = logLines[index];
  const regex = /(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}) .* \[Behaviour\] Joining (wrld_[a-f0-9-]+):.*/;
  const matches = logEntry.match(regex);

  if (!matches || matches.length < 4) {
    return null;
  }
  const date = matches[1].replace(/\./g, '-');
  const time = matches[2].replace(/:/g, '-');
  const worldId = matches[3];

  if (!validateWorldId(worldId)) {
    throw new Error('WorldId did not match the expected format');
  }

  const [year, month, day] = date.split('-');
  const [hour, minute, second] = time.split('-');
  let foundWorldName: string | null = null;
  // Extracting world name from the subsequent lines
  logLines.slice(index + 1).forEach((log) => {
    const worldNameRegex = /\[Behaviour\] Joining or Creating Room: (.+)/;
    const [, worldName] = log.match(worldNameRegex) || [];
    if (worldName && !foundWorldName) {
      foundWorldName = worldName;
    }
  });

  if (foundWorldName) {
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      worldId,
      worldName: foundWorldName
    };
  }

  throw new Error('Failed to extract world name from the subsequent log entries');
};

const convertLogLinesToWorldJoinLogInfos = (logLines: string[]): WorldJoinLogInfo[] => {
  const worldJoinLogInfos: WorldJoinLogInfo[] = [];

  logLines.forEach((log, index) => {
    if (log.includes('Joining wrld')) {
      const info = extractWorldJoinInfoFromLogs(logLines, index);
      if (info) {
        worldJoinLogInfos.push(info);
      }
    }
  });

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
  extractWorldJoinInfoFromLogs,
  convertLogLinesToWorldJoinLogInfos,
  convertWorldJoinLogInfoToOneLine
};
export type { WorldId, WorldJoinLogInfo, WorldJoinLogInfoOneLine };
