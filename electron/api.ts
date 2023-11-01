import z from 'zod';
import { initTRPC } from '@trpc/server';

// 呼び出し元は service に集約したい
import * as service from './service';

const t = initTRPC.create({ isServer: true });
const { procedure } = t;

export const router = t.router({
  // sample
  createTodo: procedure.input(z.object({ text: z.string() })).mutation(async (req) => {
    return req;
  }),
  getVRChatLogFilesDir: procedure.query(async () => {
    const logFilesDir = service.getVRChatLogFilesDir();
    return logFilesDir;
  }),
  getVRChatPhotoDir: procedure.query(async () => {
    const vrchatPhotoDir = service.getVRChatPhotoDir();
    return vrchatPhotoDir;
  })
});

export type AppRouter = typeof router;
