import PQueue from 'p-queue';
import * as log from './logger';
import { getRDBClient } from './sequelize';

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
 * データベースアクセスのためのキュー
 * - 同時実行数を制限してデータベースアクセスをキューイングする
 * - トランザクション処理をサポート
 */
class DBQueue {
  private queue: PQueue;
  private options: Required<DBQueueOptions>;

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
      log.debug(
        `DBQueue: サイズ ${this.queue.size}, 保留中 ${this.queue.pending}`,
      );
    });

    this.queue.on('idle', () => {
      log.debug('DBQueue: すべてのタスクが完了しました');
    });

    this.queue.on('error', (error) => {
      log.error({
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
        log.error({ message: 'DBQueue: タスクがタイムアウトしました' });
      }
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
    return this.queue.size === 0;
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
    this.queue.clear();
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
let dbQueueInstance: DBQueue | null = null;

/**
 * データベースキューのインスタンスを取得する
 * @param options キューのオプション
 * @returns DBQueueインスタンス
 */
export const getDBQueue = (options?: DBQueueOptions): DBQueue => {
  if (!dbQueueInstance) {
    dbQueueInstance = new DBQueue(options);
  }
  return dbQueueInstance;
};

/**
 * データベースキューのインスタンスをリセットする
 * 主にテスト用
 */
export const resetDBQueue = (): void => {
  if (dbQueueInstance) {
    dbQueueInstance.clear();
    dbQueueInstance = null;
  }
};

export default DBQueue;
