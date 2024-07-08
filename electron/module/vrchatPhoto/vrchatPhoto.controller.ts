import * as neverthrow from 'neverthrow';
import z from 'zod';
import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatPhotoService from './../vrchatPhoto/vrchatPhoto.service';

/**
 * index 済みの写真ファイルのpath一覧を取得する
 * TODO: pagination
 */
export const getVRChatLogFilePathList = async (query?: {
  gtJoinDateTime?: Date;
  ltJoinDateTime?: Date;
}): Promise<neverthrow.Result<string[], Error>> => {
  const vrchatPhotoPathList =
    await vrchatPhotoService.getVRChatPhotoPathList(query);
  return neverthrow.ok(
    vrchatPhotoPathList.map((photoPathModel) => photoPathModel.photoPath),
  );
};

export const vrchatPhotoRouter = () =>
  trpcRouter({
    getVrchatPhotoPathList: procedure
      .input(
        z
          .object({
            gtJoinDateTime: z.date().optional(),
            ltJoinDateTime: z.date().optional(),
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
  });
