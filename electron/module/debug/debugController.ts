import { z } from 'zod';
import { getRDBClient } from '../../lib/sequelize';
import { procedure as publicProcedure, router } from '../../trpc';

interface QueryInput {
  query: string;
}

export const debugRouter = router({
  executeSqlite: publicProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .mutation(async ({ input }: { input: QueryInput }) => {
      try {
        const client = getRDBClient().__client;
        const result = await client.query(input.query, {
          type: 'SELECT',
        });
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`SQLite query error: ${error.message}`);
        }
        throw new Error('Unknown SQLite query error');
      }
    }),
});
