import { z } from 'zod';
import { getDBQueue } from '../../lib/dbQueue';
import { procedure, router } from '../../trpc';

type QueryInput = {
  query: string;
};

export const debugRouter = router({
  executeSqlite: procedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .mutation(async ({ input }: { input: QueryInput }) => {
      try {
        // DBQueueを使用してクエリを実行
        return await getDBQueue().query(input.query);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`SQLite query error: ${error.message}`);
        }
        throw new Error('Unknown SQLite query error');
      }
    }),
});
