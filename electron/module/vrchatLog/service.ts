import * as datefns from 'date-fns';

import type * as vrchatLogService from '../service/vrchatLog/vrchatLog';

const removeAdjacentDuplicateWorldEntries = (
  worldJoinLogInfoList: vrchatLogService.WorldJoinLogInfo[],
): vrchatLogService.WorldJoinLogInfo[] => {
  worldJoinLogInfoList.sort((a, b) => {
    return datefns.compareAsc(
      new Date(
        Number(a.year),
        Number(a.month) - 1,
        Number(a.day),
        Number(a.hour),
        Number(a.minute),
        Number(a.second),
      ),
      new Date(
        Number(b.year),
        Number(b.month) - 1,
        Number(b.day),
        Number(b.hour),
        Number(b.minute),
        Number(b.second),
      ),
    );
  });

  // 隣接する重複を削除
  let previousWorldId: string | null = null;
  return worldJoinLogInfoList.filter((info, index) => {
    if (index === 0 || info.worldId !== previousWorldId) {
      previousWorldId = info.worldId;
      return true;
    }
    return false;
  });
};

export { removeAdjacentDuplicateWorldEntries };
