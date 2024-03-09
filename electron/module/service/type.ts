import * as neverthrow from 'neverthrow';
import * as z from 'zod';

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

export { parsePhotoFileName, PhotoFileNameSchema };

export type { PhotoFileName, PhotoFileNameWithExt, ParsedPhotoFileName };
