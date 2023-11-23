import * as neverthrow from 'neverthrow';
import * as z from 'zod';

type WorldId = `wrld_${string}`;

const photoFileNameRegex =
  /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}_\d{3,4}x\d{3,4}$/;
const PhotoFileNameSchema = z.string().regex(photoFileNameRegex);
type PhotoFileName = z.infer<typeof PhotoFileNameSchema>;
const photoFileNameWithExtRegex =
  /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}_\d{3,4}x\d{3,4}\.\w+$/;
const PhotoFileNameWithExtSchema = z.string().regex(photoFileNameWithExtRegex);
type PhotoFileNameWithExt = z.infer<typeof PhotoFileNameWithExtSchema>;
interface ParsedPhotoFileName {
  date: {
    year: string;
    month: string;
    day: string;
  };
  time: {
    hour: string;
    minute: string;
    second: string;
    millisecond: string;
  };
  resolution: {
    width: string;
    height: string;
  };
  ext: string | null;
}
const parsePhotoFileName = (
  photoFileName: PhotoFileName | PhotoFileNameWithExt,
): neverthrow.Result<ParsedPhotoFileName, string> => {
  const matches = photoFileName.match(
    /^VRChat_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2}).(\d{3})_(\d{3,4})x(\d{3,4})(?:\.(\w+))?$/,
  );
  if (!matches) {
    return neverthrow.err('parsePhotoFileName: matches is null');
  }

  const date = matches[1];
  const time = matches[2];
  const millisecond = matches[3];
  const width = matches[4];
  const height = matches[5];
  const ext = matches[6] ?? null;
  return neverthrow.ok({
    date: {
      year: date.slice(0, 4),
      month: date.slice(5, 7),
      day: date.slice(8, 10),
    },
    time: {
      hour: time.slice(0, 2),
      minute: time.slice(3, 5),
      second: time.slice(6, 8),
      millisecond,
    },
    resolution: {
      width,
      height,
    },
    ext,
  });
};

/**
 * type guard for WorldId
 */
const isWorldId = (str: string): str is WorldId => {
  return /^wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(str);
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
    /^VRChat_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2}).(\d{3})_wrld_(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/,
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

export {
  isWorldId,
  parsePhotoFileName,
  convertToJoinInfoFileName,
  PhotoFileNameSchema,
  JoinInfoFileNameSchema,
  parseJoinInfoFileName,
};

export type {
  PhotoFileName,
  PhotoFileNameWithExt,
  ParsedPhotoFileName,
  WorldId,
  JoinInfoFileName,
};
