import z from 'zod';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// 呼び出し元は集約したい
import * as service from './service';

const ee = new EventEmitter();

const t = initTRPC.create({ isServer: true });
const { procedure } = t;

export const router = t.router({
  // sample
  createTodo: procedure.input(z.object({ text: z.string() })).mutation(async (req) => {
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
    let status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' | 'logFileDirNotFound' = 'ready';
    if (vrchatLogFilesDir.path === null) {
      status = 'logFilesDirNotSet';
    } else if (vrchatLogFilesDir.error !== null) {
      status = vrchatLogFilesDir.error;
    }
    return status;
  }),
  createFiles: procedure.mutation(async () => {
    const result = service.getConfigAndValidateAndCreateFiles();
    return result.match(
      (value) => {
        ee.emit('toast', 'ファイルの作成に成功しました');
        return value;
      },
      (error) => {
        ee.emit('toast', error);
        return error;
      }
    );
  }),
  clearAllStoredSettings: procedure.mutation(async () => {
    service.clearAllStoredSettings();
    ee.emit('toast', '設定をすべて削除しました');
    return undefined;
  })
});

export type AppRouter = typeof router;
