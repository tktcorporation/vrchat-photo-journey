import type { Transaction } from '@sequelize/core';
import { getDBQueue } from './dbQueue';
import * as log from './logger';
import { getRDBClient } from './sequelize';

/**
 * データベースアクセスのユーティリティ関数を提供するモジュール
 * - DBQueueを使用して安全にデータベースアクセスを行う
 * - トランザクション処理やバッチ処理をサポート
 */

/**
 * トランザクションを使用してデータベース操作を実行する
 * @param callback トランザクションを使用するコールバック関数
 * @returns コールバック関数の実行結果
 */
export async function withTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return getDBQueue().add(async () => {
    const sequelize = getRDBClient().__client;
    return sequelize.transaction(callback);
  });
}

/**
 * 読み取り専用のSQLクエリを実行する
 * @param query 実行するSQLクエリ
 * @returns クエリの実行結果
 */
export async function executeQuery(query: string): Promise<unknown[]> {
  return getDBQueue().query(query);
}

/**
 * 複数のデータベース操作をバッチ処理として実行する
 * すべての操作は同一トランザクション内で実行される
 * @param operations 実行する操作の配列
 * @returns 各操作の実行結果の配列
 */
export async function executeBatch<T>(
  operations: ((transaction: Transaction) => Promise<T>)[],
): Promise<T[]> {
  return withTransaction(async (transaction) => {
    const results: T[] = [];
    for (const operation of operations) {
      try {
        const result = await operation(transaction);
        results.push(result);
      } catch (error) {
        log.error({ message: 'バッチ処理中にエラーが発生しました' });
        throw error; // トランザクション全体がロールバックされる
      }
    }
    return results;
  });
}

/**
 * リトライ機能付きでデータベース操作を実行する
 * @param operation 実行する操作
 * @param options リトライオプション
 * @returns 操作の実行結果
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  const shouldRetry = options.shouldRetry ?? ((_error) => true);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 最後の試行でエラーが発生した場合はエラーをスロー
      if (attempt === maxRetries - 1) {
        break;
      }

      // リトライ条件を満たさない場合はエラーをスロー
      if (!shouldRetry(error)) {
        break;
      }

      log.debug(
        `データベース操作を再試行します (${attempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}

/**
 * データベースキューの状態を取得する
 * @returns キューの状態情報
 */
export function getQueueStatus(): {
  size: number;
  pending: number;
  isIdle: boolean;
} {
  const queue = getDBQueue();
  return {
    size: queue.size,
    pending: queue.pending,
    isIdle: queue.isIdle,
  };
}

/**
 * データベースキューが空になるまで待機する
 */
export async function waitForQueueIdle(): Promise<void> {
  return getDBQueue().onIdle();
}

/**
 * データベースキューを一時停止する
 */
export function pauseQueue(): void {
  getDBQueue().pause();
}

/**
 * データベースキューを再開する
 */
export function startQueue(): void {
  getDBQueue().start();
}
