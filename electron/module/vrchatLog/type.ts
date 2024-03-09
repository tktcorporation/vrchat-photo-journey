import * as neverthrow from 'neverthrow';
import * as z from 'zod';

type WorldId = `wrld_${string}`;

/**
 * type guard for WorldId
 */
const isWorldId = (str: string): str is WorldId => {
  return /^wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(str);
};

const convertToJoinInfoFileName = ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
  worldId,
}: {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  millisecond: string;
  worldId: WorldId;
}): JoinInfoFileName => {
  return `VRChat_${year}-${month}-${day}_${hour}-${minute}-${second}.${millisecond}_${worldId}`;
};

// const isJoinInfoFileName = (str: string): str is JoinInfoFileName => {
//   return /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}
// _wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(str);
// };
const JoinInfoFileNameSchema = z
  .string()
  .regex(
    /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}_wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/,
  );
type JoinInfoFileName = z.infer<typeof JoinInfoFileNameSchema>;
const parseJoinInfoFileName = (joinInfoFileName: JoinInfoFileName) => {
  const matches = joinInfoFileName.match(
    /^VRChat_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2}).(\d{3})_(wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/,
  );
  if (!matches) {
    return neverthrow.err('parseJoinInfoFileName: matches is null');
  }

  const year = matches[1];
  const month = matches[2];
  const day = matches[3];
  const hour = matches[4];
  const minute = matches[5];
  const second = matches[6];
  const millisecond = matches[7];
  const worldId = matches[8];
  return neverthrow.ok({
    date: {
      year,
      month,
      day,
    },
    time: {
      hour,
      minute,
      second,
      millisecond,
    },
    worldId,
  });
};

export {
  isWorldId,
  convertToJoinInfoFileName,
  parseJoinInfoFileName,
  JoinInfoFileNameSchema,
};

export type { WorldId, JoinInfoFileName };
