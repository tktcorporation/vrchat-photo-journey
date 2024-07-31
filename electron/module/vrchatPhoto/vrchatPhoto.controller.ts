import * as neverthrow from 'neverthrow';
import z from 'zod';
import * as log from './../../lib/logger';
import { eventEmitter, procedure, router as trpcRouter } from './../../trpc';
import * as utilsService from './../electronUtil/service';
import * as vrchatPhotoService from './../vrchatPhoto/vrchatPhoto.service';
import { VRChatPhotoDirPathSchema } from './valueObjects';

/**
 * index 済みの写真ファイルのpath一覧を取得する
 */
const getVRChatLogFilePathModelList = async (query?: {
  gtPhotoTakenAt?: Date;
  ltPhotoTakenAt?: Date;
  orderByPhotoTakenAt: 'asc' | 'desc';
}): Promise<
  neverthrow.Result<
    {
      id: string;
      photoPath: string;
      photoTakenAt: Date;
    }[],
    Error
  >
> => {
  const vrchatPhotoPathList =
    await vrchatPhotoService.getVRChatPhotoPathList(query);
  return neverthrow.ok(
    vrchatPhotoPathList.map((photoPathModel) => ({
      id: photoPathModel.id,
      photoPath: photoPathModel.photoPath,
      photoTakenAt: photoPathModel.photoTakenAt,
    })),
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

export const setVRChatPhotoDirPathByDialog = async (): Promise<
  neverthrow.Result<void, 'canceled'>
> => {
  return (await utilsService.openGetDirDialog()).map((dirPath) => {
    vrchatPhotoService.setVRChatPhotoDirPathToSettingStore(
      VRChatPhotoDirPathSchema.parse(dirPath),
    );
    return undefined;
  });
};

export const vrchatPhotoRouter = () =>
  trpcRouter({
    getVRChatPhotoDirPath: procedure.query(async () => {
      const result = await vrchatPhotoService.getVRChatPhotoDirPath();
      return result;
    }),
    setVRChatPhotoDirPathToSettingStore: procedure.mutation(async () => {
      const result = await setVRChatPhotoDirPathByDialog();
      return result.match(
        () => {
          eventEmitter.emit('toast', 'VRChatの写真の保存先を設定しました');
          return true;
        },
        (error) => {
          eventEmitter.emit('toast', error);
          return false;
        },
      );
    }),
    clearVRChatPhotoDirPathInSettingStore: procedure.mutation(async () => {
      const result =
        await vrchatPhotoService.clearVRChatPhotoDirPathInSettingStore();
      return result;
    }),
    getVrchatPhotoPathModelList: procedure
      .input(
        z
          .object({
            gtPhotoTakenAt: z.date().optional(),
            ltPhotoTakenAt: z.date().optional(),
            orderByPhotoTakenAt: z.enum(['asc', 'desc']),
          })
          .optional(),
      )
      .query(async (ctx) => {
        const result = await getVRChatLogFilePathModelList(ctx.input);
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
    getVRChatPhotoItemData: procedure.input(z.string()).query(async (ctx) => {
      const result = await vrchatPhotoService.getVRChatPhotoItemData(ctx.input);
      if (result.isErr()) {
        return {
          data: null,
          error: result.error,
        };
      }
      return {
        data: result.value,
        error: null,
      };
    }),
    validateVRChatPhotoPath: procedure
      .input(z.string())
      .mutation(async (ctx) => {
        const result = await vrchatPhotoService.validateVRChatPhotoPathModel({
          fullpath: ctx.input,
        });
        log.debug('validateVRChatPhotoPath', ctx.input, result);
        return {
          result,
        };
      }),
  });
