import type { Transaction } from '@sequelize/core';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import PQueue from 'p-queue';
import { logger } from './logger';
import { getRDBClient } from './sequelize';

/**
 * データベースキューのエラー型
 */
export type DBQueueError =
  | { type: 'QUEUE_FULL'; message: string }
  | { type: 'TASK_TIMEOUT'; message: string }
  | { type: 'QUERY_ERROR'; message: string }
  | { type: 'TRANSACTION_ERROR'; message: string }
  | { type: 'TASK_CANCELLED'; message: string };

/**
 * データベースアクセスのためのキュー設定
 */
interface DBQueueOptions {
  /**
   * 同時実行可能なタスク数
   * @default 1
   */
  concurrency?: number;
  /**
   * キューの最大サイズ
   * @default Infinity
   */
  maxSize?: number;
  /**
   * タスクのタイムアウト時間（ミリ秒）
   * @default 30000 (30秒)
   */
  timeout?: number;
  /**
   * キューが一杯の場合の動作
   * - throw: エラーをスローする
   * - wait: 空きができるまで待機する
   * @default 'wait'
   */
  onFull?: 'throw' | 'wait';
}

/**
 * 優先度付きタスクのインターフェース
 */
interface PriorityTask<T> {
  priority?: number; // 0-10, 10が最高優先度
  signal?: AbortSignal; // キャンセル用シグナル
  task: () => Promise<T>;
}

/**
 * データベースアクセスのためのキュー
 * - 同時実行数を制限してデータベースアクセスをキューイングする
 * - トランザクション処理をサポート
 */
class DBQueue {
  private queue: PQueue;
  private options: Required<DBQueueOptions>;
  private runningTasks = new Map<string, AbortController>();
  private taskIdCounter = 0;

  constructor(options: DBQueueOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 1,
      maxSize: options.maxSize ?? Number.POSITIVE_INFINITY,
      timeout: options.timeout ?? 30000,
      onFull: options.onFull ?? 'wait',
    };

    this.queue = new PQueue({
      concurrency: this.options.concurrency,
      timeout: this.options.timeout,
      throwOnTimeout: true,
    });

    // キューの状態変化をログに出力
    this.queue.on('active', () => {
      logger.debug(
        `DBQueue: サイズ ${this.queue.size}, 保留中 ${this.queue.pending}`,
      );
    });

    this.queue.on('idle', () => {
      logger.debug('DBQueue: すべてのタスクが完了しました');
    });

    this.queue.on('error', (error) => {
      logger.error({
        message: 'DBQueue: エラーが発生しました',
        stack: error instanceof Error ? error : new Error(String(error)),
      });
    });
  }

  /**
   * キューにタスクを追加して実行する
   * @param task 実行するタスク関数
   * @returns タスクの実行結果
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    // キューが一杯かどうかをチェック
    if (this.queue.size >= this.options.maxSize) {
      if (this.options.onFull === 'throw') {
        throw new Error('DBQueue: キューが一杯です');
      }
      // 'wait'の場合は空きができるまで待機する
      await this.waitForSpace();
    }

    try {
      return (await this.queue.add(task)) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        logger.error({ message: 'DBQueue: タスクがタイムアウトしました' });
      }
      throw error;
    }
  }

  /**
   * キューにタスクを追加して実行する（Result型を返す）
   * @param task 実行するタスク関数
   * @returns タスクの実行結果をResult型でラップ
   */
  async addWithResult<T>(
    task: () => Promise<T>,
  ): Promise<Result<T, DBQueueError>> {
    try {
      if (this.queue.size >= this.options.maxSize) {
        if (this.options.onFull === 'throw') {
          return err({
            type: 'QUEUE_FULL',
            message: 'DBQueue: キューが一杯です',
          });
        }
        // 'wait'の場合は空きができるまで待機する
        await this.waitForSpace();
      }

      const result = await this.queue.add(task);
      return ok(result as T);
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        logger.error({
          message: 'DBQueue: タスクがタイムアウトしました',
          stack: error,
        });
        return err({
          type: 'TASK_TIMEOUT',
          message: `DBQueue: タスクがタイムアウトしました: ${error.message}`,
        });
      }
      // 予期せぬエラーの場合はログを出力して例外をスロー
      logger.error({
        message: 'DBQueue: タスク実行中に予期せぬエラーが発生しました',
        stack: error instanceof Error ? error : new Error(String(error)),
      });
      throw error; // 予期せぬエラーはそのままスロー
    }
  }

  /**
   * 優先度とキャンセル機能付きでタスクを追加
   * @param priorityTask 優先度付きタスク
   * @returns タスクの実行結果をResult型でラップ
   */
  async addPriorityTask<T>(
    priorityTask: PriorityTask<T>,
  ): Promise<Result<T, DBQueueError>> {
    const taskId = String(this.taskIdCounter++);
    const abortController = new AbortController();

    // 外部シグナルがある場合は連携
    if (priorityTask.signal) {
      priorityTask.signal.addEventListener('abort', () => {
        abortController.abort();
      });
    }

    try {
      if (this.queue.size >= this.options.maxSize) {
        if (this.options.onFull === 'throw') {
          return err({
            type: 'QUEUE_FULL',
            message: 'DBQueue: キューが一杯です',
          });
        }
        await this.waitForSpace();
      }

      // キャンセルされているかチェック
      if (abortController.signal.aborted) {
        return err({
          type: 'TASK_CANCELLED',
          message: 'DBQueue: タスクがキャンセルされました',
        });
      }

      this.runningTasks.set(taskId, abortController);

      const result = await this.queue.add(
        async () => {
          // 実行前に再度キャンセルチェック
          if (abortController.signal.aborted) {
            throw new Error('Task cancelled');
          }

          try {
            // キャンセルチェック用の関数（将来的に定期チェックで使用予定）
            // const checkCancellation = () => {
            //   if (abortController.signal.aborted) {
            //     throw new Error('Task cancelled during execution');
            //   }
            // };

            // タスクの実行をPromise.raceでラップ
            const taskPromise = priorityTask.task();
            const cancellationPromise = new Promise<never>((_, reject) => {
              abortController.signal.addEventListener('abort', () => {
                reject(new Error('Task cancelled'));
              });
            });

            return await Promise.race([taskPromise, cancellationPromise]);
          } finally {
            this.runningTasks.delete(taskId);
          }
        },
        { priority: priorityTask.priority ?? 5 },
      );

      return ok(result as T);
    } catch (error) {
      this.runningTasks.delete(taskId);

      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          logger.debug(`DBQueue: タスク ${taskId} がキャンセルされました`);
          return err({
            type: 'TASK_CANCELLED',
            message: 'DBQueue: タスクがキャンセルされました',
          });
        }
        if (error.name === 'TimeoutError') {
          logger.error({
            message: `DBQueue: タスクがタイムアウトしました (taskId: ${taskId}, timeout: ${this.options.timeout}ms, queueSize: ${this.queue.size}, pending: ${this.queue.pending}, running: ${this.runningTasks.size}, concurrency: ${this.options.concurrency})`,
            stack: error,
          });
          return err({
            type: 'TASK_TIMEOUT',
            message: `DBQueue: タスクがタイムアウトしました (${this.options.timeout}ms): ${error.message}`,
          });
        }
      }

      logger.error({
        message: 'DBQueue: タスク実行中に予期せぬエラーが発生しました',
        stack: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * 読み取り専用のクエリを実行する
   * @param query 実行するSQLクエリ
   * @returns クエリの実行結果
   */
  async query(query: string): Promise<unknown[]> {
    return this.add(async () => {
      const client = getRDBClient().__client;
      try {
        const result = await client.query(query, {
          type: 'SELECT',
        });
        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`SQLite query error: ${error.message}`);
        }
        throw new Error('Unknown SQLite query error');
      }
    });
  }

  /**
   * 読み取り専用のクエリを実行する（Result型を返す）
   * @param query 実行するSQLクエリ
   * @returns クエリの実行結果をResult型でラップ
   */
  async queryWithResult(
    query: string,
  ): Promise<Result<unknown[], DBQueueError>> {
    return this.addWithResult(async () => {
      const client = getRDBClient().__client;
      try {
        const result = await client.query(query, {
          type: 'SELECT',
        });
        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`SQLite query error: ${error.message}`);
        }
        throw new Error('Unknown SQLite query error');
      }
    }).catch((error) => {
      // addWithResultでスローされた予期せぬエラーを処理
      return err({
        type: 'QUERY_ERROR',
        message: `SQLiteクエリエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    });
  }

  /**
   * トランザクションを使用してタスクを実行する
   * @param task トランザクションを使用するタスク関数
   * @returns タスクの実行結果をResult型でラップ
   */
  async transaction<T>(
    task: (transaction: Transaction) => Promise<T>,
  ): Promise<Result<T, DBQueueError>> {
    return this.addWithResult(async () => {
      const client = getRDBClient().__client;
      try {
        return await client.transaction(task);
      } catch (error) {
        logger.error({
          message: 'DBQueue: トランザクション実行中にエラーが発生しました',
          stack: error instanceof Error ? error : new Error(String(error)),
        });
        throw error;
      }
    }).catch((error) => {
      // addWithResultでスローされた予期せぬエラーを処理
      return err({
        type: 'TRANSACTION_ERROR',
        message: `トランザクションエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    });
  }

  /**
   * キューに空きができるまで待機する
   */
  private async waitForSpace(): Promise<void> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.queue.size < this.options.maxSize) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  /**
   * 現在のキューサイズを取得する
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * 処理中のタスク数を取得する
   */
  get pending(): number {
    return this.queue.pending;
  }

  /**
   * キューが空かどうかを確認する
   */
  get isEmpty(): boolean {
    return this.queue.size === 0 && this.queue.pending === 0;
  }

  /**
   * キューが処理中かどうかを確認する
   */
  get isIdle(): boolean {
    return this.queue.pending === 0 && this.queue.size === 0;
  }

  /**
   * キューをクリアする
   */
  clear(): void {
    // 実行中のタスクをすべてキャンセル
    for (const [taskId, controller] of this.runningTasks) {
      controller.abort();
      logger.debug(`DBQueue: タスク ${taskId} をキャンセルしました`);
    }
    this.runningTasks.clear();
    this.queue.clear();
  }

  /**
   * 特定の条件に一致するタスクをキャンセル
   * @param predicate キャンセル条件
   */
  cancelTasks(predicate?: (taskId: string) => boolean): number {
    let cancelledCount = 0;
    for (const [taskId, controller] of this.runningTasks) {
      if (!predicate || predicate(taskId)) {
        controller.abort();
        cancelledCount++;
        logger.debug(`DBQueue: タスク ${taskId} をキャンセルしました`);
      }
    }
    return cancelledCount;
  }

  /**
   * キューが空になるまで待機する
   */
  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }

  /**
   * キューを一時停止する
   */
  pause(): void {
    this.queue.pause();
  }

  /**
   * キューを再開する
   */
  start(): void {
    this.queue.start();
  }
}

// シングルトンインスタンス
let instance: DBQueue | null = null;

/**
 * DBQueueのシングルトンインスタンスを取得する
 * @param options キューのオプション（初回のみ有効）
 * @returns DBQueueのインスタンス
 */
export const getDBQueue = (options?: DBQueueOptions): DBQueue => {
  if (!instance) {
    instance = new DBQueue(options);
  }
  return instance;
};

/**
 * テスト用にDBQueueのインスタンスをリセットする
 */
export const resetDBQueue = (): void => {
  if (instance) {
    instance.clear();
    instance = null;
  }
};

export default DBQueue;
