import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../../lib/logger';
import { VRChatLogFilePathSchema } from '../../vrchatLogFileDir/model';
import {
  getLogLinesByLogFilePathList,
  getLogLinesByLogFilePathListStreaming,
} from './logFileReader';

// 実際のファイル読み込み関数をモック
vi.mock('./logFileReader', async () => {
  const actual = await vi.importActual('./logFileReader');
  return {
    ...actual,
    getLogLinesFromLogFile: vi.fn(),
  };
});

vi.mock('../../../lib/logger');

const mockLogger = vi.mocked(logger);

describe('logFileReader - Memory Management', () => {
  let originalMemoryUsage: typeof process.memoryUsage;

  beforeEach(() => {
    vi.clearAllMocks();
    originalMemoryUsage = process.memoryUsage;
  });

  afterEach(() => {
    process.memoryUsage = originalMemoryUsage;
  });

  describe('メモリ制限機能', () => {
    it('メモリ使用量が制限を超えた場合にエラーをスローする', async () => {
      // メモリ使用量を600MBに設定
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      });

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        maxMemoryUsageMB: 500, // 500MB制限
      });

      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理をシミュレート
        }
      }).rejects.toThrow(/Memory usage exceeded limit: 600\.00MB > 500MB/);
    });

    it('メモリ使用量が制限内の場合は正常に処理する', async () => {
      // メモリ使用量を400MBに設定
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 400 * 1024 * 1024, // 400MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      });

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        maxMemoryUsageMB: 500, // 500MB制限
      });

      // エラーがスローされないことを確認
      const results = [];
      for await (const batch of generator) {
        results.push(batch);
        break; // 最初のバッチで停止
      }

      // メモリチェックのログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Processing file batch'),
      );
    });

    it('デフォルトのメモリ制限値（500MB）が適用される', async () => {
      // メモリ使用量を600MBに設定
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      });

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        // maxMemoryUsageMBを指定しない（デフォルト500MB）
      });

      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理をシミュレート
        }
      }).rejects.toThrow(/Memory usage exceeded limit: 600\.00MB > 500MB/);
    });
  });

  describe('メモリ監視とログ出力', () => {
    it('メモリ使用量をログに出力する', async () => {
      // メモリ使用量を200MBに設定
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 200 * 1024 * 1024, // 200MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      });

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        maxMemoryUsageMB: 500,
      });

      for await (const _batch of generator) {
        break; // 最初のバッチで停止
      }

      // メモリ使用量を含むログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('memory: 200.00MB'),
      );
    });

    it('バッチ処理でメモリ使用量の変化を追跡する', async () => {
      let memoryUsage = 100 * 1024 * 1024; // 初期100MB

      // メモリ使用量が段階的に増加するモック
      process.memoryUsage = vi.fn().mockImplementation(() => {
        memoryUsage += 50 * 1024 * 1024; // 50MBずつ増加
        return {
          heapUsed: memoryUsage,
          heapTotal: 1024 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
          rss: 1024 * 1024 * 1024,
        };
      });

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
        VRChatLogFilePathSchema.parse('/path/to/log2.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        maxMemoryUsageMB: 500,
        concurrency: 1, // 1つずつ処理
      });

      for await (const _batch of generator) {
        break; // 最初のバッチで停止
      }

      // メモリ使用量のチェックが複数回呼ばれることを確認
      expect(process.memoryUsage).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe('getLogLinesByLogFilePathList - メモリ警告', () => {
    it('大量のログ行がメモリに蓄積された場合に警告を出力する', async () => {
      // メモリ使用量を300MBに設定
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 300 * 1024 * 1024, // 300MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      });

      // getLogLinesFromLogFileをモック
      const mockGetLogLinesFromLogFile = vi.fn();

      // 大量の行を返すモック（メモリ警告をトリガーするため）
      const manyLines = Array.from(
        { length: 5000 },
        (_, i) =>
          `2023-01-01 10:${String(i % 60).padStart(
            2,
            '0',
          )}:00 [Info] test line ${i}`,
      );

      mockGetLogLinesFromLogFile.mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        unwrap: () => manyLines,
        value: manyLines,
      });

      // モジュール全体を再モック
      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathList: getLogLinesByLogFilePathList,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/log1.txt'),
      ];

      const result = await getLogLinesByLogFilePathList({
        logFilePathList: mockLogFilePaths,
        includesList: ['test'],
        maxMemoryUsageMB: 100, // 低い制限値で警告をトリガー
      });

      // 結果は成功するが、警告ログが出力されることを確認
      expect(result.isOk()).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Consider processing in smaller batches'),
      );
    });
  });
});
