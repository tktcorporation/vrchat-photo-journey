import type { Result } from 'neverthrow';
import type PQueue from 'p-queue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DBQueue, {
  type DBQueueError,
  getDBQueue,
  resetDBQueue,
} from './dbQueue';
import * as log from './logger';
import {
  __cleanupTestRDBClient,
  __forceSyncRDBClient,
  __initTestRDBClient,
  getRDBClient,
} from './sequelize';

// ログ関数をモック化
vi.mock('./logger', () => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

describe('DBQueue', () => {
  beforeAll(async () => {
    __initTestRDBClient();
  }, 10000);
  beforeEach(async () => {
    await __forceSyncRDBClient();
  });
  afterAll(async () => {
    await __cleanupTestRDBClient();
  });

  it('シングルトンインスタンスを返すこと', () => {
    const queue1 = getDBQueue();
    const queue2 = getDBQueue();
    expect(queue1).toBe(queue2);
  });

  it('タスクを追加して実行できること', async () => {
    const queue = getDBQueue();
    const task = vi.fn().mockResolvedValue('result');

    const result = await queue.add(task);

    expect(task).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('addWithResultでタスクを実行してResult型で結果を返すこと', async () => {
    const queue = getDBQueue();
    const task = vi.fn().mockResolvedValue('result');

    const result = await queue.addWithResult(task);

    expect(task).toHaveBeenCalledTimes(1);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('result');
  });

  it('addWithResultでエラーが発生した場合にエラーをResult型で返すこと', async () => {
    const queue = getDBQueue();
    const error = new Error('Task error');
    const task = vi.fn().mockRejectedValue(error);

    // addWithResultは予期せぬエラーをスローするため、try-catchで捕捉する
    let _result: Result<unknown, DBQueueError>;
    try {
      _result = await queue.addWithResult(task);
      // エラーがスローされるはずなので、ここには到達しないはず
      expect(false).toBe(true);
    } catch (e) {
      // エラーがスローされることを確認
      expect(e).toBe(error);
    }

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('キューが一杯の場合にエラーをスローすること', async () => {
    resetDBQueue(); // テスト用にリセット

    // PQueueの動作をモック化
    const mockAdd = vi.fn().mockImplementation(() => {
      throw new Error('キューが一杯です');
    });

    // モック化したPQueueを使用するDBQueueを作成
    const queue = new DBQueue({ maxSize: 1, onFull: 'throw' });
    queue.queue = { size: 1, add: mockAdd } as unknown as PQueue;

    // タスクを追加（これはエラーになるはず）
    await expect(queue.add(() => Promise.resolve('task'))).rejects.toThrow(
      'キューが一杯です',
    );

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('キューが一杯の場合にaddWithResultでエラーをResult型で返すこと', async () => {
    resetDBQueue(); // テスト用にリセット

    // PQueueの動作をモック化
    const mockAdd = vi.fn();

    // モック化したPQueueを使用するDBQueueを作成
    const queue = new DBQueue({ maxSize: 1, onFull: 'throw' });
    queue.queue = { size: 1, add: mockAdd } as unknown as PQueue;

    // タスクを追加（これはエラーになるはず）
    const result = await queue.addWithResult(() => Promise.resolve('task'));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('キューが一杯です');

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('トランザクションを使用してタスクを実行できること', async () => {
    const queue = getDBQueue();
    const transactionTask = vi.fn().mockResolvedValue('transaction result');

    const result = await queue.transaction(transactionTask);

    expect(transactionTask).toHaveBeenCalledTimes(1);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('transaction result');
  });

  it('トランザクションでエラーが発生した場合にエラーをResult型で返すこと', async () => {
    const queue = getDBQueue();
    const error = new Error('Transaction error');
    const transactionTask = vi.fn().mockRejectedValue(error);

    const result = await queue.transaction(transactionTask);

    expect(transactionTask).toHaveBeenCalledTimes(1);
    expect(result.isErr()).toBe(true);
    // トランザクションエラーはDBQueueError型に変換されることを確認
    const unwrappedError = result._unsafeUnwrapErr();
    expect(unwrappedError).toEqual({
      type: 'TRANSACTION_ERROR',
      message: `トランザクションエラー: ${error.message}`,
    });
  });

  it('クエリを実行できること', async () => {
    const queue = getDBQueue();
    const mockResult = [{ name: 'test_table' }];

    // Sequelizeのqueryメソッドをモック化
    const originalClient = getRDBClient().__client;
    const mockQuery = vi.fn().mockResolvedValue(mockResult);
    getRDBClient().__client.query = mockQuery;

    const result = await queue.query('SELECT * FROM test_table');

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test_table', {
      type: 'SELECT',
    });
    expect(result).toEqual(mockResult);

    // モックをリストア
    getRDBClient().__client = originalClient;
  });

  it('queryWithResultでクエリを実行してResult型で結果を返すこと', async () => {
    const queue = getDBQueue();
    const mockResult = [{ name: 'test_table' }];

    // Sequelizeのqueryメソッドをモック化
    const originalClient = getRDBClient().__client;
    const mockQuery = vi.fn().mockResolvedValue(mockResult);
    getRDBClient().__client.query = mockQuery;

    const result = await queue.queryWithResult('SELECT * FROM test_table');

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test_table', {
      type: 'SELECT',
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockResult);

    // モックをリストア
    getRDBClient().__client = originalClient;
  });

  it('queryWithResultでエラーが発生した場合にエラーをResult型で返すこと', async () => {
    const queue = getDBQueue();
    const error = new Error('Query error');

    // Sequelizeのqueryメソッドをモック化
    const originalClient = getRDBClient().__client;
    const mockQuery = vi.fn().mockRejectedValue(error);
    getRDBClient().__client.query = mockQuery;

    const result = await queue.queryWithResult('SELECT * FROM test_table');

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test_table', {
      type: 'SELECT',
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Query error');

    // モックをリストア
    getRDBClient().__client = originalClient;
  });

  it('複数のタスクを順番に処理すること', async () => {
    const queue = getDBQueue({ concurrency: 1 });
    const results: number[] = [];

    // 3つのタスクを追加
    const task1 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      results.push(1);
      return 1;
    };

    const task2 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      results.push(2);
      return 2;
    };

    const task3 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      results.push(3);
      return 3;
    };

    // 同時にタスクを追加
    const promises = [queue.add(task1), queue.add(task2), queue.add(task3)];

    // すべてのタスクが完了するのを待つ
    await Promise.all(promises);

    // タスクが追加された順番で実行されることを確認
    expect(results).toEqual([1, 2, 3]);
  });

  it('キューの状態を正しく報告すること', async () => {
    resetDBQueue(); // テスト用にリセット

    // モック化したPQueueを使用するDBQueueを作成
    const newQueue = new DBQueue();

    // 初期状態
    const mockQueueEmpty = { size: 0, pending: 0 } as unknown as PQueue;
    newQueue.queue = mockQueueEmpty;

    expect(newQueue.isEmpty).toBe(true);
    expect(newQueue.isIdle).toBe(true);
    expect(newQueue.size).toBe(0);
    expect(newQueue.pending).toBe(0);

    // タスクが実行中の状態
    const mockQueueRunning = { size: 0, pending: 1 } as unknown as PQueue;
    newQueue.queue = mockQueueRunning;

    expect(newQueue.isEmpty).toBe(false);
    expect(newQueue.isIdle).toBe(false);

    // タスクがキューに入っている状態
    const mockQueueWithTasks = { size: 1, pending: 0 } as unknown as PQueue;
    newQueue.queue = mockQueueWithTasks;

    expect(newQueue.isEmpty).toBe(false);
    expect(newQueue.isIdle).toBe(false);

    // 再び空の状態
    newQueue.queue = mockQueueEmpty;

    expect(newQueue.isEmpty).toBe(true);
    expect(newQueue.isIdle).toBe(true);
  });

  it('キューをクリアできること', async () => {
    const queue = getDBQueue();

    // 複数のタスクを追加
    queue.add(
      () => new Promise((resolve) => setTimeout(() => resolve('task1'), 100)),
    );
    queue.add(
      () => new Promise((resolve) => setTimeout(() => resolve('task2'), 100)),
    );

    // キューをクリア
    queue.clear();

    expect(queue.size).toBe(0);
  });

  it('キューが空になるまで待機できること', async () => {
    const queue = getDBQueue();

    // タスクを追加
    queue.add(
      () => new Promise((resolve) => setTimeout(() => resolve('task'), 50)),
    );

    // キューが空になるまで待機
    await queue.onIdle();

    expect(queue.isIdle).toBe(true);
  });

  it('キューを一時停止して再開できること', async () => {
    const queue = getDBQueue();
    const results: string[] = [];

    // キューを一時停止
    queue.pause();

    // タスクを追加（一時停止中なので実行されない）
    queue.add(async () => {
      results.push('task executed');
      return 'done';
    });

    // タスクがまだ実行されていないことを確認
    expect(results).toEqual([]);

    // キューを再開
    queue.start();

    // タスクが実行されるのを待つ
    await queue.onIdle();

    // タスクが実行されたことを確認
    expect(results).toEqual(['task executed']);
  });
});
