import * as neverthrow from 'neverthrow';
import z from 'zod';
import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatPhotoService from './../vrchatPhoto/vrchatPhoto.service';

/**
 * index 済みの写真ファイルのpath一覧を取得する
 * TODO: pagination
 */
const getVRChatLogFilePathList = async (query?: {
  gtPhotoTakenAt?: Date;
  ltPhotoTakenAt?: Date;
}): Promise<neverthrow.Result<string[], Error>> => {
  const vrchatPhotoPathList =
    await vrchatPhotoService.getVRChatPhotoPathList(query);
  return neverthrow.ok(
    vrchatPhotoPathList.map((photoPathModel) => photoPathModel.photoPath),
  );
};

const getCountByYearMonthList = async (): Promise<
  neverthrow.Result<
    {
      photoTakenYear: number;
      photoTakenMonth: number;
      photoCount: number;
    }[],
    never
  >
> => {
  const countByYearMonthList =
    await vrchatPhotoService.getCountByYearMonthList();
  return neverthrow.ok(countByYearMonthList);
};

export const vrchatPhotoRouter = () =>
  trpcRouter({
    getVrchatPhotoPathList: procedure
      .input(
        z
          .object({
            gtPhotoTakenAt: z.date().optional(),
            ltPhotoTakenAt: z.date().optional(),
            limit: z.number().optional(),
          })
          .optional(),
      )
      .query(async (ctx) => {
        const result = await getVRChatLogFilePathList(ctx.input);
        if (result.isErr()) {
          throw result.error;
        }
        return result.value;
      }),
    getCountByYearMonthList: procedure.query(async () => {
      const result = await getCountByYearMonthList();
      if (result.isErr()) {
        throw result.error;
      }
      console.log(result.value);
      return result.value;
    }),
  });
