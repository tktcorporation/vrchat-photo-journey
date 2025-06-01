import { z } from 'zod';
import { executeQuery } from '../../lib/dbHelper';
import { UserFacingError } from '../../lib/errors';
import { logger } from '../../lib/logger';
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
        const result = await executeQuery(input.query);
        if (result.isErr()) {
          throw new UserFacingError(
            `SQLクエリの実行に失敗しました: ${result.error.message}`,
          );
        }
        return result.value;
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new UserFacingError(
            `SQLクエリの実行に失敗しました: ${error.message}`,
          );
        }
        throw new UserFacingError(
          'SQLクエリの実行中に予期しないエラーが発生しました。',
        );
      }
    }),
  setLogLevel: procedure
    .input(
      z.object({
        level: z.union([z.literal('debug'), z.literal('info')]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        logger.setTransportsLevel(input.level);
        logger.info(`Log level set to: ${input.level}`);
        return { success: true };
      } catch (error: unknown) {
        logger.error({
          message: 'Failed to set log level',
          stack: error as Error,
        });
        throw new UserFacingError('ログレベルの設定に失敗しました。');
      }
    }),
  getLogLevel: procedure.query(() => {
    // 現在のファイルログレベルを返す (コンソールレベルも通常は同じはず)
    return logger.transports.file.level || 'info'; // level が false の場合 'info' を返す
  }),
});
