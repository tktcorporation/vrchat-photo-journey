import { z } from 'zod';
import { getDBQueue } from '../../lib/dbQueue';
import { UserFacingError } from '../../lib/errors';
import { log, error as logError, info as logInfo } from '../../lib/logger';
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
        log.transports.file.level = input.level;
        log.transports.console.level = input.level;
        logInfo(`Log level set to: ${input.level}`);
        return { success: true };
      } catch (error: unknown) {
        logError({ message: 'Failed to set log level', stack: error as Error });
        throw new UserFacingError('ログレベルの設定に失敗しました。');
      }
    }),
  getLogLevel: procedure.query(() => {
    // 現在のファイルログレベルを返す (コンソールレベルも通常は同じはず)
    return log.transports.file.level || 'info'; // level が false の場合 'info' を返す
  }),
});
