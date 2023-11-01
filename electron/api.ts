import z from 'zod';
import { initTRPC } from '@trpc/server';

const t = initTRPC.create({ isServer: true });
const { procedure } = t;

export const router = t.router({
  getTodos: procedure.query(async () => {
    const todos = '// Todoデータ一覧取得処理';
    return {
      todos
    };
  }),
  createTodo: procedure.input(z.object({ text: z.string() })).mutation(async (req) => {
    return req;
  }),
  deleteTodo: t.procedure.input(z.object({ id: z.number() })).mutation(async (req) => {
    console.log(req);
  })
});

export type AppRouter = typeof router;
