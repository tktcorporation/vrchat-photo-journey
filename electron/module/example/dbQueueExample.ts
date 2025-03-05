import type { Transaction } from '@sequelize/core';
import * as dbHelper from '../../lib/dbHelper';
import { getDBQueue } from '../../lib/dbQueue';
import * as log from '../../lib/logger';

/**
 * DBQueueの使用例を示すサンプルコード
 *
 * このモジュールは、DBQueueを使用してデータベースアクセスを
 * 安全かつ効率的に行う方法を示しています。
 */

/**
 * 基本的なクエリ実行の例
 */
export async function executeSimpleQuery(): Promise<unknown[]> {
  try {
    // 単純なクエリ実行
    const result = await dbHelper.executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );

    if (result.isErr()) {
      throw new Error(`クエリ実行エラー: ${result.error.message}`);
    }

    log.info({ message: `テーブル数: ${result.value.length}` });
    return result.value;
  } catch (error) {
    log.error({
      message: 'クエリ実行中にエラーが発生しました',
      stack: error instanceof Error ? error : undefined,
    });
    throw error;
  }
}

/**
 * トランザクションを使用した複数操作の例
 */
export async function executeTransactionExample(): Promise<void> {
  try {
    await dbHelper.withTransaction(async (_transaction) => {
      // トランザクション内で複数の操作を実行
      // 実際のアプリケーションでは、ここでモデルのCRUD操作を行います
      log.info('トランザクションを開始しました');

      // 何らかのデータベース操作

      log.info('トランザクションが完了しました');
      return true;
    });
  } catch (error) {
    log.error({
      message: 'トランザクション実行中にエラーが発生しました',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * バッチ処理の例
 */
export async function executeBatchExample(): Promise<void> {
  // バッチ処理として実行する操作の配列
  const operations = [
    async (_transaction: Transaction) => {
      // 操作1
      return { operation: 1, status: 'success' };
    },
    async (_transaction: Transaction) => {
      // 操作2
      return { operation: 2, status: 'success' };
    },
    async (_transaction: Transaction) => {
      // 操作3
      return { operation: 3, status: 'success' };
    },
  ];

  try {
    // バッチ処理を実行
    const results = await dbHelper.executeBatch(operations);

    if (results.isErr()) {
      throw new Error(`バッチ処理エラー: ${results.error.message}`);
    }

    log.info(`バッチ処理が完了しました: ${results.value.length}件の操作が成功`);
  } catch (error) {
    log.error({
      message: 'バッチ処理中にエラーが発生しました',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * リトライ機能を使用した例
 */
export async function executeWithRetry(): Promise<unknown> {
  try {
    // リトライ機能付きで操作を実行
    return await dbHelper.withRetry(
      async () => {
        // 失敗する可能性のある操作
        const result = await dbHelper.executeQuery(
          "SELECT name FROM sqlite_master WHERE type='table'",
        );
        return result;
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        shouldRetry: (error) => {
          // 特定のエラーのみリトライする条件
          if (error instanceof Error) {
            return error.message.includes('SQLITE_BUSY');
          }
          return false;
        },
      },
    );
  } catch (error) {
    log.error({
      message: 'リトライ後も操作が失敗しました',
      stack: error instanceof Error ? error : undefined,
    });
    throw error;
  }
}

/**
 * 複数の同時リクエストをシミュレートする例
 */
export async function simulateConcurrentRequests(count: number): Promise<void> {
  log.info({ message: `${count}件の同時リクエストをシミュレート` });

  // 同時リクエストを作成
  const requests = Array.from({ length: count }, (_, i) => {
    return getDBQueue().add(async () => {
      log.debug(`リクエスト ${i + 1} 実行中...`);
      // 処理時間をシミュレート
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200),
      );
      return { requestId: i + 1, status: 'completed' };
    });
  });

  // すべてのリクエストが完了するまで待機
  await Promise.all(requests);

  // キューが空になるまで待機
  await dbHelper.waitForQueueIdle();

  log.info({ message: 'すべてのリクエストが完了しました' });
}

/**
 * キューの状態を監視する例
 */
export function monitorQueueStatus(): void {
  const intervalId = setInterval(() => {
    const status = dbHelper.getQueueStatus();
    log.debug(
      `キュー状態: サイズ=${status.size}, 処理中=${status.pending}, アイドル=${status.isIdle}`,
    );

    if (status.isIdle) {
      log.info({ message: 'キューは空です' });
      clearInterval(intervalId);
    }
  }, 500);

  // 30秒後に監視を停止
  setTimeout(() => {
    clearInterval(intervalId);
    log.info({ message: 'キュー監視を停止しました' });
  }, 30000);
}
