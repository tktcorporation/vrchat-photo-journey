import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DBQueue, { getDBQueue, resetDBQueue } from './dbQueue';
import * as log from './logger';
import {
  __cleanupTestRDBClient,
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
  beforeEach(async () => {
    // テスト用のデータベースを初期化
    await __initTestRDBClient();
    // キューをリセット
    resetDBQueue();
  });

  afterEach(async () => {
    // テスト用のデータベースをクリーンアップ
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

  it('キューが一杯の場合にエラーをスローすること', async () => {
    const queue = new DBQueue({ maxSize: 1, onFull: 'throw' });

    // キューを一杯にする
    const longTask = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('done'), 100));
    });

    // 最初のタスクを追加（これはキューに入る）
    const promise1 = queue.add(longTask);

    // 2つ目のタスクを追加（これはエラーになるはず）
    await expect(queue.add(() => Promise.resolve('task2'))).rejects.toThrow(
      'キューが一杯です',
    );

    // 最初のタスクが完了するのを待つ
    await promise1;
  });

  it('トランザクションを使用してタスクを実行できること', async () => {
    const queue = getDBQueue();
    const transactionTask = vi.fn().mockResolvedValue('transaction result');

    const result = await queue.transaction(transactionTask);

    expect(transactionTask).toHaveBeenCalledTimes(1);
    expect(result).toBe('transaction result');
  });

  it('トランザクションでエラーが発生した場合にロールバックすること', async () => {
    const queue = getDBQueue();
    const error = new Error('Transaction error');
    const transactionTask = vi.fn().mockRejectedValue(error);

    await expect(queue.transaction(transactionTask)).rejects.toThrow(
      'Transaction error',
    );
    expect(transactionTask).toHaveBeenCalledTimes(1);
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
    const queue = getDBQueue();

    expect(queue.isEmpty).toBe(true);
    expect(queue.isIdle).toBe(true);
    expect(queue.size).toBe(0);
    expect(queue.pending).toBe(0);

    // タスクを追加
    const taskPromise = queue.add(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'done';
    });

    // タスクが実行中の状態を確認
    expect(queue.isEmpty).toBe(false);
    expect(queue.isIdle).toBe(false);

    // タスクが完了するのを待つ
    await taskPromise;

    // タスク完了後の状態を確認
    expect(queue.isEmpty).toBe(true);
    expect(queue.isIdle).toBe(true);
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
