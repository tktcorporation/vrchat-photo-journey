import { EventEmitter } from 'events';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import z from 'zod';

// 呼び出し元は集約したい
import path from 'path';
import * as service from './service';

const ee = new EventEmitter();

const t = initTRPC.create({ isServer: true });
const { procedure } = t;

export const router = t.router({
  // sample
  createTodo: procedure
    .input(z.object({ text: z.string() }))
    .mutation(async (req) => {
      return req;
    }),
  subscribeToast: t.procedure.subscription(() => {
    return observable((emit) => {
      function onToast(text: string) {
        emit.next(text);
      }

      ee.on('toast', onToast);

      return () => {
        ee.off('toast', onToast);
      };
    });
  }),
  getVRChatLogFilesDir: procedure.query(async () => {
    const logFilesDir = service.getVRChatLogFilesDir();
    return logFilesDir;
  }),
  getVRChatPhotoDir: procedure.query(async () => {
    const vrchatPhotoDir = service.getVRChatPhotoDir();
    return vrchatPhotoDir;
  }),
  getStatusToUseVRChatLogFilesDir: procedure.query(async () => {
    const vrchatLogFilesDir = service.getVRChatLogFilesDir();
    let status:
      | 'ready'
      | 'logFilesDirNotSet'
      | 'logFilesNotFound'
      | 'logFileDirNotFound' = 'ready';
    if (vrchatLogFilesDir.path === null) {
      status = 'logFilesDirNotSet';
    } else if (vrchatLogFilesDir.error !== null) {
      status = vrchatLogFilesDir.error;
    }
    return status;
  }),
  createFiles: procedure.mutation(async () => {
    const result = await service.getConfigAndValidateAndCreateFiles();
    return result.match(
      () => {
        ee.emit('toast', 'ファイルの作成に成功しました');
        return true;
      },
      (error) => {
        ee.emit('toast', error);
        return false;
      },
    );
  }),
  getToCreateInfoFileMap: procedure.query(async () => {
    const result =
      await service.getConfigAndValidateAndGetToCreateInfoFileMap();
    return result.match(
      (r) => {
        return r.map((obj) => ({
          ...obj,
          // src に直接入れられるように buffer を base64 に変換
          content: `data:image/${path
            .extname(obj.fileName)
            .replace('.', '')};base64,${obj.content.toString('base64')}`,
        }));
      },
      (error) => {
        ee.emit('toast', error);
        return [];
      },
    );
  }),
  clearAllStoredSettings: procedure.mutation(async () => {
    service.clearAllStoredSettings();
    ee.emit('toast', '設定をすべて削除しました');
    return undefined;
  }),
  clearStoredSetting: procedure
    .input(z.union([z.literal('logFilesDir'), z.literal('vrchatPhotoDir')]))
    .mutation(async (ctx) => {
      const result = service.clearStoredSetting(ctx.input);
      result.match(
        () => {
          ee.emit('toast', '設定を削除しました');
          return undefined;
        },
        (error) => {
          ee.emit('toast', error);
          return undefined;
        },
      );
    }),
  openPathOnExplorer: procedure.input(z.string()).mutation(async (ctx) => {
    const result = await service.openPathOnExplorer(ctx.input);
    return result.match(
      () => {
        return true;
      },
      (error) => {
        ee.emit('toast', error);
        return false;
      },
    );
  }),
  openDirOnExplorer: procedure.input(z.string()).mutation(async (ctx) => {
    const result = await service.openDirOnExplorer(ctx.input);
    return result.match(
      () => {
        return true;
      },
      (error) => {
        ee.emit('toast', error);
        return false;
      },
    );
  }),
  setVRChatPhotoDirByDialog: procedure.mutation(async () => {
    const result = await service.setVRChatPhotoDirByDialog();
    return result.match(
      () => {
        ee.emit('toast', 'VRChatの写真の保存先を設定しました');
        return true;
      },
      (error) => {
        ee.emit('toast', error);
        return false;
      },
    );
  }),
  setVRChatLogFilesDirByDialog: procedure.mutation(async () => {
    const result = await service.setVRChatLogFilesDirByDialog();
    return result.match(
      () => {
        ee.emit('toast', 'VRChatのログファイルの保存先を設定しました');
        return true;
      },
      (error) => {
        ee.emit('toast', error);
        return false;
      },
    );
  }),
  getVRChatPhotoItemDataListByYearMonth: procedure
    .input(z.object({ year: z.string(), month: z.string() }))
    .query(async (ctx) => {
      const result = await service.getVRChatPhotoItemDataListByYearMonth(
        ctx.input.year,
        ctx.input.month,
      );
      return result.match(
        (r) => {
          return r.map((obj) => ({
            path: obj.path,
            dataImage: `data:image/${path
              .extname(obj.path)
              .replace('.', '')};base64,${obj.data.toString('base64')}`,
          }));
        },
        (error) => {
          ee.emit('toast', error);
          return [];
        },
      );
    }),
  getVRChatPhotoFolderYearMonthList: procedure.query(async () => {
    const result = await service.getVRChatPhotoFolderYearMonthList();
    return result.match(
      (r) => {
        return r;
      },
      (error) => {
        ee.emit('toast', error);
        return [];
      },
    );
  }),
  getVRChatPhotoWithWorldIdAndDate: procedure
    .input(z.object({ year: z.string(), month: z.string() }))
    .query(async (ctx) => {
      const result = await service.getVRChatPhotoWithWorldIdAndDate(ctx.input);
      return result.match(
        (r) => {
          return r;
        },
        (error) => {
          ee.emit('toast', error);
          return [];
        },
      );
    }),
  getVRChatPhotoItemData: procedure.input(z.string()).query(async (ctx) => {
    const result = await service.getVRChatPhotoItemData(ctx.input);
    return result.match(
      (r) => {
        return `data:image/${path
          .extname(ctx.input)
          .replace('.', '')};base64,${r.toString('base64')}`;
      },
      (error) => {
        ee.emit('toast', error);
        return '';
      },
    );
  }),
});

export type AppRouter = typeof router;
