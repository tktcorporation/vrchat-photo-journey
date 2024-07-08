import * as neverthrow from 'neverthrow';
import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatPhotoService from './../vrchatPhoto/vrchatPhoto.service';

/**
 * index 済みの写真ファイルのpath一覧を取得する
 * TODO: pagination
 */
export const getVRChatLogFilePathList = async (): Promise<
  neverthrow.Result<string[], Error>
> => {
  const vrchatPhotoPathList = await vrchatPhotoService.getVRChatPhotoPathList();
  return neverthrow.ok(
    vrchatPhotoPathList.map((photoPathModel) => photoPathModel.photoPath),
  );
};

export const vrchatPhotoRouter = () =>
  trpcRouter({
    getVrchatPhotoPathList: procedure.query(async () => {
      const result = await getVRChatLogFilePathList();
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    }),
  });
